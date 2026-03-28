from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any, Optional
from app.models.category import CategoryCreate, CategoryUpdate
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

class CategoryService:
    @staticmethod
    def serialize_doc(doc: dict) -> dict:
        if doc and "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def create_category(self, db: AsyncIOMotorDatabase, data: CategoryCreate) -> Dict[str, Any]:
        category_dict = data.dict()
        category_dict["created_at"] = datetime.utcnow()
        category_dict["updated_at"] = datetime.utcnow()
        
        result = await db.categories.insert_one(category_dict)
        saved = await db.categories.find_one({"_id": result.inserted_id})
        return self.serialize_doc(saved)

    async def _populate_category_items(self, db: AsyncIOMotorDatabase, cat: dict) -> dict:
        """Helper to populate items for both static and dynamic categories"""
        cat_type = cat.get("type", "static")
        
        if cat_type == "dynamic":
            criteria = cat.get("dynamic_criteria", {})
            limit = criteria.get("limit", 20)
            tags = criteria.get("tags", [])
            language = criteria.get("language")
            content_type = criteria.get("content_type")
            
            # Dynamic Query: Match specific tags, language, content_type, must be published
            query = {"status": "published"}
            if tags and len(tags) > 0:
                query["tags"] = {"$in": tags}
            
            if language:
                if language == 'en':
                    # International: NOT Indian languages
                    query["language"] = {"$nin": ["hi", "te", "ml", "ta"]}
                elif language == 'indian':
                    # Indian: Specifically these codes
                    query["language"] = {"$in": ["hi", "te", "ml", "ta"]}
                elif language == 'all':
                    # No language filter
                    pass
                elif isinstance(language, list):
                    query["language"] = {"$in": language}
                else:
                    query["language"] = language
            
            if content_type:
                query["content_type"] = content_type
            
            # Sort by rating (highest to lowest)
            reviews_cursor = db.reviews.find(query).sort("overall_rating", -1).limit(limit)
            populated_items = await reviews_cursor.to_list(length=limit)
            cat["items"] = [self.serialize_doc(r) for r in populated_items]
        else:
            # Static logic: fetch by slugs in order
            slugs = cat.get("items", [])
            query = {"slug": {"$in": slugs}, "status": "published"}
            
            # Fetch reviews
            reviews_cursor = db.reviews.find(query)
            reviews = await reviews_cursor.to_list(length=50)
            
            # Create a lookup map to preserve item array order
            review_map = {r["slug"]: self.serialize_doc(r) for r in reviews}
            
            populated_items = []
            for slug in slugs:
                if slug in review_map:
                    populated_items.append(review_map[slug])
            cat["items"] = populated_items
            
        return self.serialize_doc(cat)

    async def get_all_categories(self, db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
        cursor = db.categories.find({}).sort("rank", 1)  # Ascending by rank
        categories = await cursor.to_list(length=100)
        
        result = []
        for cat in categories:
            populated = await self._populate_category_items(db, cat)
            result.append(populated)
        return result

    async def get_category(self, db: AsyncIOMotorDatabase, category_id: str) -> Dict[str, Any]:
        if not ObjectId.is_valid(category_id):
            raise HTTPException(status_code=400, detail="Invalid Category ID")
        cat = await db.categories.find_one({"_id": ObjectId(category_id)})
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        return await self._populate_category_items(db, cat)

    async def update_category(self, db: AsyncIOMotorDatabase, category_id: str, data: CategoryUpdate) -> Dict[str, Any]:
        if not ObjectId.is_valid(category_id):
            raise HTTPException(status_code=400, detail="Invalid Category ID")
        
        update_data = {k: v for k, v in data.dict(exclude_unset=True).items()}
        if not update_data:
            return await self.get_category(db, category_id)
            
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.categories.update_one(
            {"_id": ObjectId(category_id)},
            {"$set": update_data}
        )
        
        return await self.get_category(db, category_id)

    async def delete_category(self, db: AsyncIOMotorDatabase, category_id: str):
        if not ObjectId.is_valid(category_id):
            raise HTTPException(status_code=400, detail="Invalid Category ID")
        
        result = await db.categories.delete_one({"_id": ObjectId(category_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
            
        return {"message": "Category deleted successfully"}

    async def get_populated_categories(self, db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
        """Used by public API to return categories with populated movie posters/reviews"""
        return await self.get_all_categories(db)

category_service = CategoryService()
