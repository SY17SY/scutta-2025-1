from flask import render_template, current_app
from flask import request, jsonify
from app import db
from sqlalchemy import desc
from app.models import Match, Player
from datetime import datetime, timezone

@current_app.route('/')
def index():
    return render_template('index.html')

@current_app.route('/password.html')
def password():
    return render_template('password.html')

@current_app.route('/approval.html')
def approval():
    return render_template('approval.html')

@current_app.route('/assignment.html')
def assignment():
    return render_template('assignment.html')

@current_app.route('/settings.html')
def settings():
    return render_template('settings.html')

@current_app.route('/submit_match', methods=['POST'])
def submit_match():
    data = request.get_json()
    
    if not data or not isinstance(data, list):
        return jsonify({"error": "올바른 데이터를 제출해주세요."}), 400

    for match in data:
        if not isinstance(match, dict):
            return jsonify({"error": "각 경기 데이터는 객체 형식이어야 합니다."}), 400
        
        winner_name = match.get('winner')
        loser_name = match.get('loser')
        score_value = match.get('score')
    
        if not winner_name or not loser_name or not score_value:
            continue
        
        winner = Player.query.filter_by(name=winner_name).first()
        if not winner:
            winner = Player(name=winner_name)
            db.session.add(winner)

        loser = Player.query.filter_by(name=loser_name).first()
        if not loser:
            loser = Player(name=loser_name)
            db.session.add(loser)
        
        db.session.flush()
        
        new_match = Match(
            winner=winner.id, 
            winner_name=winner.name, 
            loser=loser.id, 
            loser_name=loser.name, 
            score=score_value, 
            timestamp=datetime.now(timezone.utc), 
            approved=False
        )
        db.session.add(new_match)
    
    db.session.commit()
    return jsonify({"message": f"{len(data)}개의 경기 결과가 제출되었습니다!"}), 200

@current_app.route('/rankings', methods=['GET'])
def rankings():
    category = request.args.get('category', 'wins')
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', 10))

    category_mapping = {
        'wins': 'win_count',
        'losses': 'loss_count',
        'winRate': 'win_rate',
        'matches': 'match_count',
        'opponents': 'opponent_count',
        'achievements': 'achievements'
    }

    field = category_mapping.get(category)
    if not field:
        return jsonify([])

    players = Player.query.order_by(
        desc(getattr(Player, field)),
        desc(Player.match_count)
    ).offset(offset).limit(limit).all()
    
    if category == 'matches':
        field = 'win_rate'

    response = [
        {
            'current_rank': index + 1 + offset,  # 순위 계산
            'rank': player.rank or '무',
            'name': player.name,
            'category_value': getattr(player, field, 0),
            'match_count': player.match_count or 0
        }
        for index, player in enumerate(players)
    ]

    return jsonify(response)

@current_app.route('/approve_matches', methods=['POST'])
def approve_matches():
    ids = request.json.get('ids', [])
    matches = Match.query.filter(Match.id.in_(ids), Match.approved == False).all()

    for match in matches:
        match.approved = True
        winner = Player.query.get(match.winner)
        loser = Player.query.get(match.loser)
        if winner:
            winner.match_count += 1
            winner.win_count += 1
            winner.win_rate = round((winner.win_count / winner.match_count) * 100, 2) if winner.match_count > 0 else 0
            winner.opponent_count = calculate_opponent_count(winner.id)
        if loser:
            loser.match_count += 1
            loser.loss_count += 1
            loser.win_rate = round((loser.win_count / loser.match_count) * 100, 2) if winner.match_count > 0 else 0
            loser.opponent_count = calculate_opponent_count(loser.id)
    
    db.session.commit()
    return jsonify({'success': True, 'message': '선택한 경기가 승인되었습니다.'})

@current_app.route('/delete_matches', methods=['POST'])
def delete_matches():
    ids = request.json.get('ids', [])
    matches = Match.query.filter(Match.id.in_(ids), Match.approved == True).all()

    for match in matches:
        winner = Player.query.get(match.winner)
        loser = Player.query.get(match.loser)
        if winner:
            winner.match_count -= 1
            winner.win_count -= 1
            winner.win_rate = round((winner.win_count / winner.match_count) * 100, 2) if winner.match_count > 0 else 0
            winner.opponent_count = calculate_opponent_count(winner.id)
        if loser:
            loser.match_count -= 1
            loser.loss_count -= 1
            loser.win_rate = round((loser.win_count / loser.match_count) * 100, 2) if loser.match_count > 0 else 0
            loser.opponent_count = calculate_opponent_count(loser.id)

    Match.query.filter(Match.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'success': True, 'message': '선택한 경기가 삭제되었습니다.'})

@current_app.route('/get_matches', methods=['GET'])
def get_matches():
    matches = Match.query.order_by(Match.approved, Match.timestamp.desc()).all()
    response = [
        {
            'id': match.id,
            'winner_name': match.winner_name,
            'loser_name': match.loser_name,
            'score': match.score,
            'approved': match.approved
        }
        for match in matches
    ]
    return jsonify(response)

def calculate_opponent_count(player_id):
    from sqlalchemy import or_
    
    matches = Match.query.filter(
        or_(Match.winner == player_id, Match.loser == player_id),
        Match.approved == True
    ).all()

    opponent_ids = set()
    for match in matches:
        if match.winner == player_id:
            opponent_ids.add(match.loser)
        elif match.loser == player_id:
            opponent_ids.add(match.winner)

    return len(opponent_ids)

@current_app.route('/register_players', methods=['POST'])
def register_players():
    data = request.get_json()
    players = data.get('players', [])
    added_count = 0

    for name in players:
        if not Player.query.filter_by(name=name).first():
            new_player = Player(name=name)
            db.session.add(new_player)
            added_count += 1

    db.session.commit()
    return jsonify({'success': True, 'added_count': added_count})

@current_app.route('/get_players', methods=['GET'])
def get_players():
    players = Player.query.order_by(Player.name).all()
    response = []
    for player in players:
        response.append({
            'id': player.id,
            'name': player.name,
            'win_count': player.win_count,
            'win_rate': player.win_rate,
            'match_count': player.match_count,
            'achievements': player.achievements
        })
    return jsonify(response)

@current_app.route('/delete_players', methods=['POST'])
def delete_players():
    data = request.get_json()
    ids = data.get('ids', [])

    Player.query.filter(Player.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()

    return jsonify({'success': True})