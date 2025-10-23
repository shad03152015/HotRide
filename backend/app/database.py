from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

# MongoDB client and database instances
client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    """Connect to MongoDB database"""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    print(f"Connected to MongoDB database: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("Closed MongoDB connection")


async def create_indexes():
    """Create database indexes for users collection"""
    global db

    # Unique index on email (sparse to allow null)
    await db.users.create_index("email", unique=True, sparse=True)

    # Unique index on phone (sparse to allow null)
    await db.users.create_index("phone", unique=True, sparse=True)

    # Compound unique index on oauth_provider + oauth_id
    await db.users.create_index(
        [("oauth_provider", 1), ("oauth_id", 1)],
        unique=True,
        sparse=True
    )

    # Index on is_active for query performance
    await db.users.create_index("is_active")

    print("Database indexes created successfully")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db
