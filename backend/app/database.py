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
    """Create database indexes for all collections"""
    global db

    # Users collection indexes
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

    # Bookings collection indexes
    from app.models.booking import BOOKING_INDEXES
    for index in BOOKING_INDEXES:
        if isinstance(index, tuple):
            await db.bookings.create_index([index])
        elif isinstance(index, list):
            await db.bookings.create_index(index)

    # Livestreams collection indexes
    from app.models.livestream import LIVESTREAM_INDEXES, LIVE_COMMENT_INDEXES
    for index in LIVESTREAM_INDEXES:
        if isinstance(index, tuple):
            await db.livestreams.create_index([index])
        elif isinstance(index, list):
            await db.livestreams.create_index(index)

    # Live comments collection indexes
    for index in LIVE_COMMENT_INDEXES:
        if isinstance(index, tuple):
            await db.live_comments.create_index([index])
        elif isinstance(index, list):
            await db.live_comments.create_index(index)

    # Ratings collection indexes
    from app.models.rating import RATING_INDEXES
    for index in RATING_INDEXES:
        if isinstance(index, tuple):
            await db.ratings.create_index([index])
        elif isinstance(index, list):
            await db.ratings.create_index(index)

    print("Database indexes created successfully")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db
