from app import db
from datetime import datetime, timezone

# 선수 DB 모델
class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    previous_rank = db.Column(db.Integer, default=None)
    rank_change = db.Column(db.String(10), default=None)  # New/Up/Down
    rank = db.Column(db.Integer, default=None)
    match_count = db.Column(db.Integer, default=0)
    win_count = db.Column(db.Integer, default=0)
    loss_count = db.Column(db.Integer, default=0)
    win_rate = db.Column(db.Float, default=0.0)
    opponent_count = db.Column(db.Integer, default=0)
    achievements = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"<Player {self.name}>"

# 경기 DB 모델
class Match(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    winner = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    winner_name = db.Column(db.String(100), nullable=False)
    loser = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    loser_name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.String(10), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    approved = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<Match {self.winner_name} vs {self.loser_name}>"

class UpdateLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    html_content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))