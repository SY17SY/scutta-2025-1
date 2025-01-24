from app import db
from datetime import datetime
from zoneinfo import ZoneInfo

seoul_time = datetime.now(ZoneInfo("Asia/Seoul"))

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    is_valid = db.Column(db.Boolean, default=True)
    previous_rank = db.Column(db.Integer, default=None)
    rank_change = db.Column(db.String(10), default=None)  # New/Up/Down
    rank = db.Column(db.Integer, default=None)
    match_count = db.Column(db.Integer, default=0)
    win_count = db.Column(db.Integer, default=0)
    loss_count = db.Column(db.Integer, default=0)
    rate_count = db.Column(db.Float, default=0.0)
    opponent_count = db.Column(db.Integer, default=0)
    achieve_count = db.Column(db.Integer, default=0)
    betting_count = db.Column(db.Integer, default=100)
    win_order = db.Column(db.Integer, default=None)
    loss_order = db.Column(db.Integer, default=None)
    match_order = db.Column(db.Integer, default=None)
    rate_order = db.Column(db.Integer, default=None)
    opponent_order = db.Column(db.Integer, default=None)
    achieve_order = db.Column(db.Integer, default=None)
    betting_order = db.Column(db.Integer, default=None)

    def __repr__(self):
        return f"<Player {self.name}>"

class Match(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    winner = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    winner_name = db.Column(db.String(100), nullable=False)
    loser = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    loser_name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.String(10), nullable=False)
    timestamp = db.Column(db.DateTime, default=seoul_time)
    approved = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<Match {self.winner_name} vs {self.loser_name}>"

class UpdateLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    html_content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=seoul_time)

class League(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    p1 = db.Column(db.String(100), nullable=False)
    p2 = db.Column(db.String(100), nullable=False)
    p3 = db.Column(db.String(100), nullable=False)
    p4 = db.Column(db.String(100), nullable=False)
    p5 = db.Column(db.String(100), nullable=False)
    p1p2 = db.Column(db.Integer, default=None)
    p1p3 = db.Column(db.Integer, default=None)
    p1p4 = db.Column(db.Integer, default=None)
    p1p5 = db.Column(db.Integer, default=None)
    p2p1 = db.Column(db.Integer, default=None)
    p2p3 = db.Column(db.Integer, default=None)
    p2p4 = db.Column(db.Integer, default=None)
    p2p5 = db.Column(db.Integer, default=None)
    p3p1 = db.Column(db.Integer, default=None)
    p3p2 = db.Column(db.Integer, default=None)
    p3p4 = db.Column(db.Integer, default=None)
    p3p5 = db.Column(db.Integer, default=None)
    p4p1 = db.Column(db.Integer, default=None)
    p4p2 = db.Column(db.Integer, default=None)
    p4p3 = db.Column(db.Integer, default=None)
    p4p5 = db.Column(db.Integer, default=None)
    p5p1 = db.Column(db.Integer, default=None)
    p5p2 = db.Column(db.Integer, default=None)
    p5p3 = db.Column(db.Integer, default=None)
    p5p4 = db.Column(db.Integer, default=None)

class Betting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    p1_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    p1_name = db.Column(db.String(100), nullable=False)
    p2_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    p2_name = db.Column(db.String(100), nullable=False)
    point = db.Column(db.Integer, nullable=False)
    approved = db.Column(db.Boolean, default=False)
    submitted = db.Column(db.Boolean, default=False)
    result = db.Column(db.Integer, db.ForeignKey('match.id'), nullable=True)

    participants = db.relationship('BettingParticipant', backref='betting', cascade='all, delete-orphan')

class BettingParticipant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    betting_id = db.Column(db.Integer, db.ForeignKey('betting.id'), nullable=False)
    participant_name = db.Column(db.String(100), nullable=False)
    participant_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=True)
    winner_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=True)

class TodayPartner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    p1_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    p1_name = db.Column(db.String(100), nullable=False)
    p2_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    p2_name = db.Column(db.String(100), nullable=False)
    submitted = db.Column(db.Boolean, default=False)
    