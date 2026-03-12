from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from app.models.prediction import UpcomingMovieCreate, UpcomingMovieInDB, PredictionCreate, PredictionInDB, UserProfile
from app.models.review import Verdict
from typing import List, Optional

class PredictionService:
    def _calculate_level(self, correct_predictions: int) -> int:
        # User requested: "15 correct predictions level up and increase in each level increeases the difficulty"
        level = 1
        diff = 15
        next_level_req = diff
        while correct_predictions >= next_level_req:
            level += 1
            diff += 5
            next_level_req += diff
        return level

    def _get_earned_badges(self, correct_predictions: int) -> List[str]:
        # Expanded Ritualistic Badge Hierarchy
        badges = []
        if correct_predictions >= 1:
            badges.append("Seeker of the Silver Veil")
        if correct_predictions >= 3:
            badges.append("Initiate of the First Rite")
        if correct_predictions >= 7:
            badges.append("Silent Watcher of the Archive")
        if correct_predictions >= 12:
            badges.append("Acolyte of Infinite Prophecy")
        if correct_predictions >= 18:
            badges.append("Messenger of the Imprint")
        if correct_predictions >= 25:
            badges.append("Guardian of Cinematic Truth")
        if correct_predictions >= 35:
            badges.append("Disciple of the Divine Lens")
        if correct_predictions >= 50:
            badges.append("Seer of the Sacred Screen")
        if correct_predictions >= 70:
            badges.append("Oracle of the Eternal Glow")
        if correct_predictions >= 100:
            badges.append("High Priest of the Verdict")
        if correct_predictions >= 150:
            badges.append("Archon of Prophetic DNA")
        if correct_predictions >= 200:
            badges.append("Sentinel of the Sanctuary")
        if correct_predictions >= 300:
            badges.append("Venerable Voice of the Temple")
        if correct_predictions >= 450:
            badges.append("Arbiter of Absolute Vision")
        if correct_predictions >= 600:
            badges.append("Celestial Critic of Rarity")
        if correct_predictions >= 800:
            badges.append("Avatar of the Great Invocation")
        if correct_predictions >= 1000:
            badges.append("Alpha & Omega of the Temple")
        return badges

    async def get_or_create_user(self, db, firebase_uid: str, email: str = None, display_name: str = None) -> UserProfile:
        user_doc = await db.users.find_one({"firebase_uid": firebase_uid})
        if not user_doc:
            new_user = UserProfile(
                firebase_uid=firebase_uid,
                email=email,
                display_name=display_name
            )
            user_dict = new_user.model_dump()
            user_dict["created_at"] = datetime.utcnow()
            result = await db.users.insert_one(user_dict)
            user_dict["_id"] = str(result.inserted_id)
            return UserProfile(**user_dict)
        return UserProfile(**user_doc)

    async def create_upcoming_movie(self, db, movie_data: UpcomingMovieCreate) -> UpcomingMovieInDB:
        movie_dict = movie_data.model_dump()
        movie_dict["created_at"] = datetime.utcnow()
        result = await db.upcoming_movies.insert_one(movie_dict)
        movie_dict["_id"] = str(result.inserted_id)
        return UpcomingMovieInDB(**movie_dict)

    async def list_open_movies(self, db) -> List[UpcomingMovieInDB]:
        cursor = db.upcoming_movies.find({"status": "open"}).sort("created_at", -1)
        movies = await cursor.to_list(length=100)
        return [UpcomingMovieInDB(**{**m, "_id": str(m["_id"])}) for m in movies]
        
    async def list_all_upcoming_movies(self, db) -> List[UpcomingMovieInDB]:
        cursor = db.upcoming_movies.find().sort("created_at", -1)
        movies = await cursor.to_list(length=100)
        return [UpcomingMovieInDB(**{**m, "_id": str(m["_id"])}) for m in movies]

    async def make_prediction(self, db, firebase_uid: str, prediction_data: PredictionCreate) -> PredictionInDB:
        # Ensure movie is open
        try:
            movie_id = ObjectId(prediction_data.upcoming_movie_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid movie ID")
            
        movie = await db.upcoming_movies.find_one({"_id": movie_id})
        if not movie or movie.get("status") != "open":
            raise HTTPException(status_code=400, detail="Movie is not open for predictions")
            
        # Ensure user hasn't predicted yet
        existing_pred = await db.predictions.find_one({
            "user_uid": firebase_uid,
            "upcoming_movie_id": prediction_data.upcoming_movie_id
        })
        if existing_pred:
            # Update existing prediction rather than failing
            update_data = {
                "predicted_verdict": prediction_data.predicted_verdict,
                "created_at": datetime.utcnow() # Update timestamp
            }
            await db.predictions.update_one({"_id": existing_pred["_id"]}, {"$set": update_data})
            existing_pred.update(update_data)
            return PredictionInDB(**{**existing_pred, "_id": str(existing_pred["_id"])})

        # Insert new
        pred_dict = {
            "user_uid": firebase_uid,
            "upcoming_movie_id": prediction_data.upcoming_movie_id,
            "predicted_verdict": prediction_data.predicted_verdict,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        result = await db.predictions.insert_one(pred_dict)
        pred_dict["_id"] = str(result.inserted_id)
        return PredictionInDB(**pred_dict)
        
    async def get_user_predictions(self, db, firebase_uid: str) -> List[PredictionInDB]:
        cursor = db.predictions.find({"user_uid": firebase_uid}).sort("created_at", -1)
        preds = await cursor.to_list(length=200)
        return [PredictionInDB(**{**p, "_id": str(p["_id"])}) for p in preds]

    async def resolve_upcoming_movie(self, db, movie_id: str, actual_verdict: Verdict) -> dict:
        try:
            obj_id = ObjectId(movie_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid movie ID")

        movie = await db.upcoming_movies.find_one({"_id": obj_id})
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        if movie.get("status") == "resolved":
            raise HTTPException(status_code=400, detail="Movie already resolved")

        # Update movie
        await db.upcoming_movies.update_one(
            {"_id": obj_id},
            {"$set": {
                "status": "resolved", 
                "actual_verdict": actual_verdict,
                "resolved_at": datetime.utcnow()
            }}
        )

        # Process all pending predictions for this movie
        cursor = db.predictions.find({"upcoming_movie_id": movie_id, "status": "pending"})
        predictions = await cursor.to_list(length=None)
        
        correct_uids = []
        incorrect_uids = []
        for p in predictions:
            is_correct = (p.get("predicted_verdict") == actual_verdict)
            new_status = "correct" if is_correct else "incorrect"
            await db.predictions.update_one(
                {"_id": p["_id"]},
                {"$set": {"status": new_status, "resolved_at": datetime.utcnow()}}
            )
            if is_correct:
                correct_uids.append(p["user_uid"])
            else:
                incorrect_uids.append(p["user_uid"])

        # Update users who got it right
        for uid in correct_uids:
            # Increment correct predictions
            await db.users.update_one(
                {"firebase_uid": uid},
                {"$inc": {"correct_predictions": 1}}
            )
            # Re-calculate level
            user = await db.users.find_one({"firebase_uid": uid})
            if user:
                new_lvl = self._calculate_level(user.get("correct_predictions", 0))
                new_badges = self._get_earned_badges(user.get("correct_predictions", 0))
                
                update_fields = {"badges": new_badges}
                if new_lvl > user.get("level", 1):
                    update_fields["level"] = new_lvl
                    
                await db.users.update_one(
                    {"firebase_uid": uid},
                    {"$set": update_fields}
                )

        return {
            "resolved": True,
            "correct_predictions": len(correct_uids),
            "incorrect_predictions": len(incorrect_uids)
        }

prediction_service = PredictionService()
