"""
MinIO Client Utility for Sugar Sack Counter Backend
Handles file uploads to MinIO object storage
"""

import os
import io
from datetime import datetime
from typing import Optional, Tuple
from minio import Minio
from minio.error import S3Error
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MinioClient:
    """MinIO client for handling file uploads to object storage"""

    def __init__(
        self,
        endpoint: str = None,
        access_key: str = None,
        secret_key: str = None,
        secure: bool = False,
        bucket_name: str = "sugar-sacks"
    ):
        """
        Initialize MinIO client

        Args:
            endpoint: MinIO server endpoint (e.g., 'localhost:9000')
            access_key: MinIO access key
            secret_key: MinIO secret key
            secure: Use HTTPS (False for local development)
            bucket_name: Default bucket name
        """
        # Get credentials from environment variables or use defaults
        self.endpoint = endpoint or os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = access_key or os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = secret_key or os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.secure = secure
        self.bucket_name = bucket_name or os.getenv("MINIO_BUCKET_NAME", "sugar-sacks")

        # Initialize MinIO client
        self.client = Minio(
            endpoint=self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )

        # Ensure bucket exists
        self._ensure_bucket_exists()

        logger.info(f"✅ MinIO client initialized for bucket: {self.bucket_name}")

    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if it doesn't"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"📦 Created bucket: {self.bucket_name}")
            else:
                logger.info(f"📦 Using existing bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"❌ Failed to create bucket {self.bucket_name}: {e}")
            raise

    def generate_object_name(self, original_filename: str, prefix: str = None) -> str:
        """
        Generate a unique object name for storage

        Args:
            original_filename: Original filename
            prefix: Optional prefix for organization (e.g., 'original/', 'annotated/')

        Returns:
            Unique object name
        """
        # Extract file extension
        _, ext = os.path.splitext(original_filename)
        ext = ext.lower()

        # Generate unique ID and timestamp
        unique_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Build object name
        if prefix:
            object_name = f"{prefix.rstrip('/')}/{timestamp}_{unique_id}{ext}"
        else:
            object_name = f"{timestamp}_{unique_id}{ext}"

        return object_name

    def generate_row_image_path(self, session_id: str, row_type: str, image_type: str, original_filename: str) -> str:
        """
        Generate image path for sack/box row storage

        Args:
            session_id: Session ID from database
            row_type: 'sack' or 'box'
            image_type: 'original' or 'annotated'
            original_filename: Original filename

        Returns:
            Path for MinIO storage
        """
        # Extract file extension
        _, ext = os.path.splitext(original_filename)
        ext = ext.lower()

        # Generate unique ID and timestamp
        unique_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Build path according to schema: {image_type}/{row_type}/{session_id}/{timestamp}_{unique_id}{ext}
        if image_type == 'annotated':
            # For annotated images, add _annotated suffix
            filename = f"{timestamp}_{unique_id}_annotated{ext}"
        else:
            filename = f"{timestamp}_{unique_id}{ext}"

        path = f"{image_type}/{row_type}/{session_id}/{filename}"

        logger.info(f"Generated {image_type} image path for {row_type} row: {path}")
        return path

    def upload_file(
        self,
        file_data: bytes,
        original_filename: str,
        prefix: str = None,
        content_type: str = "application/octet-stream"
    ) -> Tuple[bool, str, str]:
        """
        Upload file to MinIO

        Args:
            file_data: File data as bytes
            original_filename: Original filename
            prefix: Optional prefix (e.g., 'original/', 'annotated/')
            content_type: MIME type of the file

        Returns:
            Tuple of (success, object_name, url)
        """
        try:
            # Generate unique object name
            object_name = self.generate_object_name(original_filename, prefix)

            # Get file size
            file_size = len(file_data)

            # Upload to MinIO
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=io.BytesIO(file_data),
                length=file_size,
                content_type=content_type
            )

            # Generate URL
            try:
                url = self.client.presigned_get_object(
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    expires=604800  # 7 days in seconds
                )
            except Exception as url_error:
                logger.warning(f"⚠️ Could not generate presigned URL: {url_error}")
                url = f"http://{self.endpoint}/{self.bucket_name}/{object_name}"

            logger.info(f"✅ Uploaded {original_filename} as {object_name} ({file_size} bytes)")
            return True, object_name, url

        except S3Error as e:
            logger.error(f"❌ Failed to upload {original_filename}: {e}")
            return False, "", ""
        except Exception as e:
            logger.error(f"❌ Unexpected error uploading {original_filename}: {e}")
            return False, "", ""

    def upload_row_image(
        self,
        file_data: bytes,
        session_id: str,
        row_type: str,
        image_type: str,
        original_filename: str,
        content_type: str = "image/jpeg"
    ) -> Tuple[bool, str, str]:
        """
        Upload image for sack/box row with proper path structure

        Args:
            file_data: Image data as bytes
            session_id: Session ID from database
            row_type: 'sack' or 'box'
            image_type: 'original' or 'annotated'
            original_filename: Original filename
            content_type: MIME type of the image

        Returns:
            Tuple of (success, object_path, url)
        """
        try:
            # Generate path for row image
            object_path = self.generate_row_image_path(
                session_id=session_id,
                row_type=row_type,
                image_type=image_type,
                original_filename=original_filename
            )

            # Get file size
            file_size = len(file_data)

            # Upload to MinIO
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_path,
                data=io.BytesIO(file_data),
                length=file_size,
                content_type=content_type
            )

            # Generate URL
            try:
                url = self.client.presigned_get_object(
                    bucket_name=self.bucket_name,
                    object_name=object_path,
                    expires=604800  # 7 days in seconds
                )
            except Exception as url_error:
                logger.warning(f"⚠️ Could not generate presigned URL: {url_error}")
                url = f"http://{self.endpoint}/{self.bucket_name}/{object_path}"

            logger.info(f"✅ Uploaded {image_type} image for {row_type} row: {object_path} ({file_size} bytes)")
            return True, object_path, url

        except S3Error as e:
            logger.error(f"❌ Failed to upload {image_type} image for {row_type} row: {e}")
            return False, "", ""
        except Exception as e:
            logger.error(f"❌ Unexpected error uploading {image_type} image for {row_type} row: {e}")
            return False, "", ""

    def upload_image_file(
        self,
        file_path: str,
        prefix: str = None
    ) -> Tuple[bool, str, str]:
        """
        Upload image file from disk

        Args:
            file_path: Path to image file
            prefix: Optional prefix

        Returns:
            Tuple of (success, object_name, url)
        """
        try:
            with open(file_path, 'rb') as file:
                file_data = file.read()

            original_filename = os.path.basename(file_path)

            # Determine content type based on file extension
            _, ext = os.path.splitext(file_path)
            ext = ext.lower()

            content_type_map = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.bmp': 'image/bmp',
                '.webp': 'image/webp'
            }

            content_type = content_type_map.get(ext, 'image/jpeg')

            return self.upload_file(file_data, original_filename, prefix, content_type)

        except Exception as e:
            logger.error(f"❌ Failed to read and upload {file_path}: {e}")
            return False, "", ""

    def delete_file(self, object_name: str) -> bool:
        """
        Delete file from MinIO

        Args:
            object_name: Object name to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"🗑️ Deleted object: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"❌ Failed to delete {object_name}: {e}")
            return False

    def get_file_url(self, object_name: str, expires: int = 604800) -> str:
        """
        Get presigned URL for file

        Args:
            object_name: Object name
            expires: URL expiration in seconds (default: 7 days)

        Returns:
            Presigned URL
        """
        try:
            try:
                return self.client.presigned_get_object(
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    expires=expires
                )
            except Exception as e:
                logger.warning(f"⚠️ Could not generate presigned URL for {object_name}: {e}")
                return f"http://{self.endpoint}/{self.bucket_name}/{object_name}"
        except S3Error as e:
            logger.error(f"❌ Failed to generate URL for {object_name}: {e}")
            return ""

    def list_files(self, prefix: str = None) -> list:
        """
        List files in bucket with optional prefix

        Args:
            prefix: Optional prefix to filter

        Returns:
            List of object names
        """
        try:
            objects = self.client.list_objects(self.bucket_name, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            logger.error(f"❌ Failed to list files with prefix {prefix}: {e}")
            return []


# Singleton instance
_minio_client = None

def get_minio_client() -> MinioClient:
    """
    Get or create MinIO client singleton

    Returns:
        MinioClient instance
    """
    global _minio_client
    if _minio_client is None:
        _minio_client = MinioClient()
    return _minio_client


# Example usage
if __name__ == "__main__":
    # Test the MinIO client
    client = get_minio_client()

    # Test bucket info
    print(f"Bucket: {client.bucket_name}")
    print(f"Endpoint: {client.endpoint}")

    # List files (should be empty initially)
    files = client.list_files()
    print(f"Files in bucket: {len(files)}")

    # Example of generating object name
    test_name = client.generate_object_name("test_image.jpg", "original")
    print(f"Generated object name: {test_name}")

    # Example of generating row image paths
    print("\n📁 Example row image paths:")

    # Sack row paths
    sack_original_path = client.generate_row_image_path(
        session_id="session_abc123",
        row_type="sack",
        image_type="original",
        original_filename="sack_row_1.jpg"
    )
    print(f"Sack original: {sack_original_path}")

    sack_annotated_path = client.generate_row_image_path(
        session_id="session_abc123",
        row_type="sack",
        image_type="annotated",
        original_filename="sack_row_1.jpg"
    )
    print(f"Sack annotated: {sack_annotated_path}")

    # Box row paths
    box_original_path = client.generate_row_image_path(
        session_id="session_def456",
        row_type="box",
        image_type="original",
        original_filename="box_row_1.jpg"
    )
    print(f"Box original: {box_original_path}")

    box_annotated_path = client.generate_row_image_path(
        session_id="session_def456",
        row_type="box",
        image_type="annotated",
        original_filename="box_row_1.jpg"
    )
    print(f"Box annotated: {box_annotated_path}")
