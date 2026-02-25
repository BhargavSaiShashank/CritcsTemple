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

    async def get_all_categories(self, db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
        cursor = db.categories.find({}).sort("rank", 1)  # Ascending by rank
        categories = await cursor.to_list(length=100)
        return [self.serialize_doc(c) for c in categories]

    async def get_category(self, db: AsyncIOMotorDatabase, category_id: str) -> Dict[str, Any]:
        if not ObjectId.is_valid(category_id):
            raise HTTPException(status_code=400, detail="Invalid Category ID")
        cat = await db.categories.find_one({"_id": ObjectId(category_id)})
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        return self.serialize_doc(cat)

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
        cursor = db.categories.find({}).sort("rank", 1)
        categories = await cursor.to_list(length=100)
        
        result = []
        for cat in categories:
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
            result.append(self.serialize_doc(cat))
            
        return result

category_service = CategoryService()
