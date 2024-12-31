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

@current_app.route('/get_matches', methods=['GET'])
def get_matches():
    matches = Match.query.order_by(Match.approved, Match.timestamp.desc()).all()
    response = [
        {
            'id': match.id,
            'winner_name': match.winner_name,
            'score': match.score,
            'loser_name': match.loser_name,
            'approved': match.approved
        }
        for match in matches
    ]
    return jsonify(response)

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

@current_app.route('/approve_all', methods=['POST'])
def approve_all():
    matches = Match.query.filter_by(approved=False).all()
    for match in matches:
        match.approved = True
    db.session.commit()
    return {'success': True, 'message': '모든 경기가 승인되었습니다.'}

@current_app.route('/approve_selected', methods=['POST'])
def approve_selected():
    data = request.get_json()
    if not data or 'ids' not in data:
        return {'success': False, 'error': '승인할 경기 ID가 제공되지 않았습니다.'}, 400

    selected_ids = data['ids']
    matches = Match.query.filter(Match.id.in_(selected_ids)).all()
    for match in matches:
        match.approved = True
    db.session.commit()
    return {'success': True, 'message': f'{len(matches)}개의 경기가 승인되었습니다.'}

@current_app.route('/delete_selected', methods=['POST'])
def delete_selected():
    data = request.get_json()
    if not data or 'ids' not in data:
        return {'success': False, 'error': '삭제할 경기 ID가 제공되지 않았습니다.'}, 400

    selected_ids = data['ids']
    Match.query.filter(Match.id.in_(selected_ids)).delete(synchronize_session=False)
    db.session.commit()
    return {'success': True, 'message': f'{len(selected_ids)}개의 경기가 삭제되었습니다.'}

