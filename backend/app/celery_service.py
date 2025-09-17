from backend.app.celery_service import Celery
import os 


def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        broker=os.getenv("REDIS_URL", "redis://localhost:6379/0")
    )
    celery.conf.update(app.config)
    return celery