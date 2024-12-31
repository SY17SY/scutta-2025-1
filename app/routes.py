from flask import render_template, current_app
from flask import request, jsonify
from app import db
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
    category = request.args.get('category', 'win_count')  # 기본 정렬 기준: 승리수
    players = Player.query.order_by(getattr(Player, category).desc()).limit(10).all()

    rankings = [
        {
            "rank": idx + 1,
            "name": player.name,
            "category_value": getattr(player, category),
            "match_count": player.match_count
        }
        for idx, player in enumerate(players)
    ]

    return jsonify(rankings)

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
            winner.opponent_count = calculate_opponent_count(winner.id)
        if loser:
            loser.match_count += 1
            loser.loss_count += 1
            loser.opponent_count = calculate_opponent_count(loser.id)
    
    db.session.commit()
    return jsonify({'success': True, 'message': '선택한 경기가 승인되었습니다.'})

@current_app.route('/delete_matches', methods=['POST'])
def delete_matches():
    ids = request.json.get('ids', [])
    Match.query.filter(Match.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'success': True, 'message': '선택한 경기가 삭제되었습니다.'})

@current_app.route('/get_matches', methods=['GET'])
def get_matches():
    matches = Match.query.order_by(Match.approved, Match.timestamp.desc()).all()
    response = [
        {
            'id': match.id,
            'winner_name': Player.query.get(match.winner).name if Player.query.get(match.winner) else '',
            'loser_name': Player.query.get(match.loser).name if Player.query.get(match.loser) else '',
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


