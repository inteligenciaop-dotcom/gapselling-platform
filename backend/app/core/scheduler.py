from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.campaign_dispatch import process_pending_sends

scheduler = AsyncIOScheduler()


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(process_pending_sends, 'interval', minutes=1, id='campaign_dispatch', replace_existing=True)
    scheduler.start()


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
