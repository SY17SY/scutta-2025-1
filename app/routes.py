from flask import render_template, current_app
from flask import request, jsonify
from app import db
from sqlalchemy import desc
from app.models import Match, Player, UpdateLog
from datetime import datetime
from zoneinfo import ZoneInfo

seoul_time = datetime.now(ZoneInfo("Asia/Seoul"))

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
            timestamp=seoul_time, 
            approved=False
        )
        db.session.add(new_match)
    
    db.session.commit()
    return jsonify({"message": f"{len(data)}개의 경기 결과가 제출되었습니다!"}), 200

def update_player_orders():
    """Update the ranking orders for all players in various categories."""
    categories = [
        ('win_order', Player.win_count.desc(), Player.match_count.desc()),
        ('loss_order', Player.loss_count.desc(), Player.match_count.desc()),
        ('match_order', Player.match_count.desc(), Player.win_count.desc()),
        ('rate_order', Player.rate_count.desc(), Player.match_count.desc()),
        ('opponent_order', Player.opponent_count.desc(), Player.win_count.desc()),
        ('achieve_order', Player.achieve_count.desc(), Player.match_count.desc()),
    ]

    for order_field, primary_criteria, secondary_criteria in categories:
        players = Player.query.order_by(primary_criteria, secondary_criteria).all()
        for rank, player in enumerate(players, start=1):
            setattr(player, order_field, rank)

    db.session.commit()

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
            winner.rate_count = round((winner.win_count / winner.match_count) * 100, 2)
            winner.opponent_count = calculate_opponent_count(winner.id)
        if loser:
            loser.match_count += 1
            loser.loss_count += 1
            loser.rate_count = round((loser.win_count / loser.match_count) * 100, 2)
            loser.opponent_count = calculate_opponent_count(loser.id)

    db.session.commit()
    update_player_orders()
    return jsonify({'success': True, 'message': '선택한 경기가 승인되었습니다.'})

@current_app.route('/rankings', methods=['GET'])
def rankings():
    category = request.args.get('category', 'win_order')
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', 10))

    valid_categories = ['win_order', 'loss_order', 'match_order', 'rate_order', 'opponent_order', 'achieve_order']
    if category not in valid_categories:
        return jsonify([])

    players = Player.query.order_by(getattr(Player, category)).offset(offset).limit(limit).all()

    response = []
    for player in players:
        if category == 'match_order':
            category_value = player.rate_count
        else:
            attribute_name = category.replace('_order', '_count')
            category_value = getattr(player, attribute_name, 0)

        response.append({
            'current_rank': getattr(player, category),
            'rank': player.rank or '무',
            'name': player.name,
            'category_value': category_value or 0,
            'match_count': player.match_count or 0
        })

    return jsonify(response)

@current_app.route('/search_players', methods=['GET'])
def search_players():
    query = request.args.get('query', '').lower()
    category = request.args.get('category', 'win_order')

    valid_categories = ['win_order', 'loss_order', 'match_order', 'rate_order', 'opponent_order', 'achieve_order']
    if category not in valid_categories:
        return jsonify([])

    players = Player.query.filter(Player.name.ilike(f"%{query}%")).order_by(getattr(Player, category)).all()

    response = []
    for player in players:
        if category == 'match_order':
            category_value = player.rate_count
        else:
            attribute_name = category.replace('_order', '_count')
            category_value = getattr(player, attribute_name, 0)

        response.append({
            'current_rank': getattr(player, category),
            'rank': player.rank or '무',
            'name': player.name,
            'category_value': category_value or 0,
            'match_count': player.match_count or 0
        })

    return jsonify(response)

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
            winner.rate_count = round((winner.win_count / winner.match_count) * 100, 2) if winner.match_count > 0 else 0
            winner.opponent_count = calculate_opponent_count(winner.id)
        if loser:
            loser.match_count -= 1
            loser.loss_count -= 1
            loser.rate_count = round((loser.win_count / loser.match_count) * 100, 2) if loser.match_count > 0 else 0
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
            'rate_count': player.rate_count,
            'match_count': player.match_count,
            'achieve_count': player.achieve_count
        })
    return jsonify(response)

@current_app.route('/delete_players', methods=['POST'])
def delete_players():
    data = request.get_json()
    ids = data.get('ids', [])

    Player.query.filter(Player.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()

    return jsonify({'success': True})

@current_app.route('/check_players', methods=['POST'])
def check_players():
    matches = request.json.get('matches', [])
    player_names = set()
    for match in matches:
        player_names.add(match['winner'])
        player_names.add(match['loser'])

    existing_players = {player.name for player in Player.query.filter(Player.name.in_(player_names)).all()}
    unknown_players = list(player_names - existing_players)

    return jsonify({'unknownPlayers': unknown_players})

@current_app.route('/update_ranks', methods=['POST'])
def update_ranks():
    try:
        players = Player.query.filter(Player.match_count >= 3).order_by(
            Player.rate_count.desc(), Player.match_count.desc()
        ).all()

        total_players = len(players)
        cal_quotas = [round(total_players * p) for p in [0.07, 0.17, 0.29, 0.43, 0.57, 0.71, 0.83, 0.93, 1.00]]
        quotas = []
        for i in range(9):
            result = cal_quotas[i]
            for j in range(i):
                result = cal_quotas[i] - quotas[j]
            quotas.append(result)
    
        for player in players:
            if player.rate_count == 100 and player.match_count < 7:
                player.previous_rank = 5
                quotas[4] -= 1

        current_rank = 1
        for player in players:
            if player.previous_rank is None:
                while quotas[current_rank - 1] == 0:
                    current_rank += 1
                player.previous_rank = current_rank
                quotas[current_rank - 1] -= 1

        for player in Player.query.filter(Player.match_count < 15).all():
            player.previous_rank = None

        for player in players:
            if player.previous_rank is None:
                player.rank_change = None
            elif player.rank is None:
                player.rank_change = 'New'
            elif player.previous_rank < player.rank:
                player.rank_change = 'Up'
            elif player.previous_rank > player.rank:
                player.rank_change = 'Down'
            else:
                player.rank_change = None

        table_rows = [
            f"""
            <tr>
                <td class="border border-gray-300 p-2">{p.name}</td>
                <td class="border border-gray-300 p-2">{p.rank or '무'}</td>
                <td class="border border-gray-300 p-2">{p.previous_rank or '무'}</td>
                <td class="border border-gray-300 p-2">{p.rate_count}%</td>
                <td class="border border-gray-300 p-2">{p.rank_change or ''}</td>
            </tr>
            """
            for p in Player.query.order_by(Player.rate_count.desc()).filter(Player.rank_change.isnot(None)).all()
        ]

        html_content = f"""
        <div>
            <table class="w-full border-collapse border border-gray-300 text-center">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border border-gray-300 p-2">{total_players}명</th>
                        <th class="border border-gray-300 p-2">전</th>
                        <th class="border border-gray-300 p-2">후</th>
                        <th class="border border-gray-300 p-2">승률</th>
                        <th class="border border-gray-300 p-2">변동</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(table_rows)}
                </tbody>
            </table>
        </div>
        """

        log = UpdateLog(title=str(seoul_time.date()), html_content=html_content)
        db.session.add(log)

        for player in Player.query.all():
            player.rank = player.previous_rank
            player.previous_rank = None

        db.session.commit()
        return jsonify({'success': True, 'message': '부수 업데이트가 완료되었습니다.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@current_app.route('/logs', methods=['GET'])
def get_logs():
    logs = UpdateLog.query.order_by(UpdateLog.timestamp.desc()).all()
    return jsonify([{'id': log.id, 'title': log.title} for log in logs])

@current_app.route('/delete_logs', methods=['POST'])
def delete_logs():
    ids = request.json.get('ids', [])
    UpdateLog.query.filter(UpdateLog.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'success': True})

@current_app.route('/log/<int:log_id>', methods=['GET'])
def get_log_detail(log_id):
    log = UpdateLog.query.get(log_id)
    if not log:
        return jsonify({'error': '로그를 찾을 수 없습니다.'}), 404

    return jsonify({'title': log.title, 'html_content': log.html_content})
