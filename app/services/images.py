import cloudinary
import cloudinary.uploader
from app.core.config import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

class ImageService:
    @staticmethod
    async def upload_image(file_path: str, folder: str = "reviews"):
        """
        Uploads an image to Cloudinary and returns the URL.
        """
        try:
            response = cloudinary.uploader.upload(file_path, folder=folder)
            return response.get("secure_url")
        except Exception as e:
            print(f"Cloudinary Upload Error: {str(e)}")
            return None

image_service = ImageService()
