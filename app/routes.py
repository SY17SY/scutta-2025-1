from flask import render_template, jsonify, current_app, request
from app import db
from app.models import Match, Player, UpdateLog, League, Betting, BettingParticipant, TodayPartner
from datetime import datetime
from zoneinfo import ZoneInfo

@current_app.route('/health', methods=['GET'])
def health_check():
    response = current_app.response_class(
        response="OK",
        status=200,
        mimetype='text/plain'
    )
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    return response

@current_app.route('/')
def index():
    return render_template('index.html')

@current_app.route('/partner.html')
def partner():
    return render_template('partner.html')

@current_app.route('/league.html')
def league():
    return render_template('league.html')

@current_app.route('/betting.html')
def betting():
    bettings = Betting.query.filter(Betting.submitted == False).order_by(Betting.id.desc()).all()
    
    return render_template('betting.html', bettings=bettings)

@current_app.route('/password.html')
def password():
    return render_template('password.html')

@current_app.route('/betting_approval.html')
def betting_approval():
    return render_template('betting_approval.html')

@current_app.route('/approval.html')
def approval():
    return render_template('approval.html')

@current_app.route('/assignment.html')
def assignment():
    return render_template('assignment.html')

@current_app.route('/settings.html')
def settings():
    return render_template('settings.html')

@current_app.route('/favicon.ico')
def favicon():
    return current_app.send_static_file('favicon.ico')

@current_app.route('/player/<int:player_id>', methods=['GET'])
def player_detail(player_id):
    player = Player.query.get(player_id)
    if not player:
        return "선수를 찾을 수 없습니다.", 404

    return render_template('player_detail.html', player=player)

@current_app.route('/league/<int:league_id>', methods=['GET'])
def league_detail(league_id):
    league = League.query.get_or_404(league_id)
    players = [league.p1, league.p2, league.p3, league.p4, league.p5]
    
    player_ids = []
    for player_name in players:
        player = Player.query.filter_by(name=player_name).first()
        player_id = player.id if player else None
        player_ids.append(player_id)

    indexed_players = [{'index': idx, 'player': player_name, 'player_id': player_id} for idx, (player_name, player_id) in enumerate(zip(players, player_ids))]
    
    scores = {}

    for row in range(5):
        for col in range(5):
            if row != col:
                key = f"p{row + 1}p{col + 1}"
                scores[key] = getattr(league, key, None)

    return render_template('league_detail.html', league=league, players=indexed_players, scores=scores)

@current_app.route('/betting/<int:betting_id>', methods=['GET'])
def betting_detail(betting_id):
    betting = Betting.query.get_or_404(betting_id)
    
    matches = Match.query.filter(
        ((Match.winner == betting.p1_id) & (Match.loser == betting.p2_id)) |
        ((Match.winner == betting.p2_id) & (Match.loser == betting.p1_id))
    ).order_by(Match.timestamp.desc()).limit(10).all()

    recent_matches = []
    p1_wins, p2_wins = 0, 0
    for match in matches:
        if match.winner == betting.p1_id:
            p1_wins += 1
            score = match.score
        else:
            p2_wins += 1
            original_score = match.score.split(':')
            score = f"{original_score[1]}:{original_score[0]}"
        recent_matches.append({
            'p1_name': match.winner_name if match.winner == betting.p1_id else match.loser_name,
            'score': score,
            'p2_name': match.loser_name if match.winner == betting.p1_id else match.winner_name
        })
    
    participants = [{
        'name': p.participant_name,
        'id': p.participant_id,
        'winner_id': p.winner_id
    } for p in betting.participants]

    return render_template(
        'betting_detail.html', betting=betting, participants=participants,
        recent_matches=recent_matches, win_rate={'p1_wins': p1_wins, 'p2_wins': p2_wins}
    )


# index.js

@current_app.route('/check_players', methods=['POST'])
def check_players():
    matches = request.json.get('matches', [])
    player_names = set()
    for match in matches:
        player_names.add(match['winner'])
        player_names.add(match['loser'])

    existing_players = {player.name for player in Player.query.filter(Player.name.in_(player_names), Player.is_valid == True).all()}
    unknown_players = list(player_names - existing_players)

    return jsonify({'unknownPlayers': unknown_players})

def update_player_orders_by_point():
    categories = [
        ('achieve_order', Player.achieve_count.desc()),
        ('betting_order', Player.betting_count.desc()),
    ]

    for order_field, primary_criteria in categories:
        players = Player.query.filter(Player.is_valid == True).order_by(primary_criteria).all()
        
        current_rank = 0
        previous_primary_value = None
        
        primary_field_name = primary_criteria.element.name

        for i, player in enumerate(players, start=1):
            primary_value = getattr(player, primary_field_name)
            if primary_value != previous_primary_value:
                current_rank = i
                previous_primary_value = primary_value
            
            setattr(player, order_field, current_rank)

    db.session.commit()

@current_app.route('/submit_matches', methods=['POST'])
def submit_matches():
    matches = request.get_json()
    
    if not matches or not isinstance(matches, list):
        return jsonify({"error": "올바른 데이터를 제출해주세요."}), 400

    for match in matches:
        if not isinstance(match, dict):
            return jsonify({"error": "각 경기 데이터는 객체 형식이어야 합니다."}), 400
        
        winner_name = match.get('winner')
        loser_name = match.get('loser')
        score_value = match.get('score')
        league_tf = match.get('league')
    
        if not winner_name or not loser_name or not score_value:
            continue
        
        winner = Player.query.filter_by(name=winner_name).first()
        loser = Player.query.filter_by(name=loser_name).first()
        
        current_time = datetime.now(ZoneInfo("Asia/Seoul"))
        
        new_match = Match(
            winner=winner.id, 
            winner_name=winner.name, 
            loser=loser.id, 
            loser_name=loser.name, 
            score=score_value, 
            timestamp=current_time, 
            approved=False
        )
        db.session.add(new_match)
        
        today_partner = TodayPartner.query.filter_by(p1_name=winner_name, p2_name=loser_name).first()
        if not today_partner:
            today_partner = TodayPartner.query.filter_by(p1_name=loser_name, p2_name=winner_name).first()
        
        if today_partner:
            today_partner.submitted = True

        if league_tf:
            winner.betting_count += 3
            update_player_orders_by_point()
        
    db.session.commit()
    return jsonify({"message": f"{len(matches)}개의 경기 결과가 제출되었습니다!"}), 200

@current_app.route('/rankings', methods=['GET'])
def rankings():
    category = request.args.get('category', 'win_order')
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', 10))

    valid_categories = ['win_order', 'loss_order', 'match_order', 'rate_order', 'opponent_order', 'achieve_order', 'betting_order']
    if category not in valid_categories:
        return jsonify([])

    secondary_criteria = {
        'win_order': Player.match_count.desc(),
        'loss_order': Player.match_count.desc(),
        'match_order': Player.win_count.desc(),
        'rate_order': Player.match_count.desc(),
        'opponent_order': Player.match_count.desc(),
        'achieve_order': Player.betting_count.desc(),
        'betting_order': Player.achieve_count.desc(),
    }
    
    dynamic_column_2 = {
        'win_order': 'match_count',
        'loss_order': 'match_count',
        'match_order': 'rate_count',
        'rate_order': 'match_count',
        'opponent_order': 'match_count',
        'achieve_order': 'betting_count',
        'betting_order': 'achieve_count',
    }
    
    primary_order = getattr(Player, category)
    attribute_name = category.replace('_order', '_count')
    secondary_order = secondary_criteria.get(category)
    attribute_name_2 = dynamic_column_2.get(category)
    
    players = Player.query.filter(Player.is_valid == True).order_by(primary_order, secondary_order).offset(offset).limit(limit).all()

    response = []
    for player in players:
        category_value = getattr(player, attribute_name, 0)
        category_value_2 = getattr(player, attribute_name_2, 0)

        response.append({
            'id': player.id,
            'current_rank': getattr(player, category),
            'rank': player.rank or '무',
            'name': player.name,
            'category_value': category_value or 0,
            'category_value_2': category_value_2 or 0,
            'match_count': player.match_count or 0
        })

    return jsonify(response)

@current_app.route('/search_players', methods=['GET'])
def search_players():
    query = request.args.get('query', '').strip()
    category = request.args.get('category', 'win_order')
    
    if len(query) < 2:
        return jsonify([])

    valid_categories = ['win_order', 'loss_order', 'match_order', 'rate_order', 'opponent_order', 'achieve_order', 'betting_order']
    if category not in valid_categories:
        return jsonify([])

    secondary_criteria = {
        'win_order': Player.match_count.desc(),
        'loss_order': Player.match_count.desc(),
        'match_order': Player.win_count.desc(),
        'rate_order': Player.match_count.desc(),
        'opponent_order': Player.match_count.desc(),
        'achieve_order': Player.betting_count.desc(),
        'betting_order': Player.achieve_count.desc(),
    }
    
    dynamic_column_2 = {
        'win_order': 'match_count',
        'loss_order': 'match_count',
        'match_order': 'rate_count',
        'rate_order': 'match_count',
        'opponent_order': 'match_count',
        'achieve_order': 'betting_count',
        'betting_order': 'achieve_count',
    }
    
    primary_order = getattr(Player, category)
    attribute_name = category.replace('_order', '_count')
    secondary_order = secondary_criteria.get(category)
    attribute_name_2 = dynamic_column_2.get(category)

    players = Player.query.filter(Player.name.ilike(f"%{query}%")).order_by(primary_order, secondary_order).all()

    response = []
    for player in players:
        category_value = getattr(player, attribute_name, 0)
        category_value_2 = getattr(player, attribute_name_2, 0)

        response.append({
            'id': player.id,
            'current_rank': getattr(player, category),
            'rank': player.rank or '무',
            'name': player.name,
            'category_value': category_value or 0,
            'category_value_2': category_value_2 or 0,
            'match_count': player.match_count or 0
        })

    return jsonify(response)


# betting_approval.js

@current_app.route('/get_bettings', methods=['GET'])
def get_bettings():
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', 30))
    tab = request.args.get('tab', 'all')
    
    query = Betting.query.filter(Betting.submitted == True).order_by(Betting.approved, Betting.id.desc())
    
    if tab == 'pending':
        query = query.filter(Betting.approved == False)
    elif tab == 'approved':
        query = query.filter(Betting.approved == True)
    
    bettings = query.offset(offset).limit(limit).all()
    
    match_ids = [betting.result for betting in bettings]
    matches = Match.query.filter(Match.id.in_(match_ids)).all()
    match_response = {
        match.id: {
            'id': match.id,
            'winner_name': match.winner_name,
            'winner_id': match.winner,
            'loser_name': match.loser_name,
            'score': match.score
        }
        for match in matches
    }
    
    response = []
    for betting in bettings:
        match_info = match_response.get(betting.result)
        if match_info:
            participants = [
                {
                    'id': participant.id,
                    'participant_name': participant.participant_name,
                    'winner_id': participant.winner_id,
                    'betting_id': participant.betting_id
                }
                for participant in betting.participants
            ]
            
            win_participants = [
                participant['participant_name']
                for participant in participants
                if participant['winner_id'] == match_info['winner_id']
            ]
            
            lose_participants = [
                participant['participant_name']
                for participant in participants
                if participant['winner_id'] != match_info['winner_id']
            ]
            
            response.append({
                'id': betting.id,
                'match_id': betting.result,
                'participants': participants,
                'point': betting.point,
                'approved': betting.approved,
                'match': match_info,
                'win_participants': win_participants,
                'lose_participants': lose_participants
            })
    
    return jsonify(response)
        
@current_app.route('/approve_bettings', methods=['POST'])
def approve_bettings():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'success': False, 'message': '승인할 베팅이 선택되지 않았습니다.'}), 400
    
    bettings = Betting.query.filter(Betting.id.in_(ids), Betting.approved == False).all()

    for betting in bettings:
        match = Match.query.filter_by(id=betting.result).first()

        if not match:
            continue

        winner = Player.query.filter_by(id=match.winner).first()
        loser = Player.query.filter_by(id=match.loser).first()
        if not winner or not loser:
            continue
        
        winner.betting_count -= betting.point
        loser.betting_count -= betting.point
        
        participants = betting.participants
        
        for participant in participants:
            participated_player = Player.query.filter_by(id=participant.participant_id).first()
            participated_player.betting_count -= betting.point

        winner_participants = [
            Player.query.filter_by(id=participant.participant_id).first()
            for participant in participants
            if participant.winner_id == winner.id
        ]
        total_sharers = 1 + len(winner_participants)
        
        total_points = betting.point * (2 + len(participants))
        winner_points = total_points + (total_points % (1 + len([p for p in participants if p.winner_id == winner.id])))
        
        share = winner_points // total_sharers

        for winner_participant in winner_participants:
            if winner_participant:
                winner_participant.betting_count += share

        winner.betting_count += share

        betting.approved = True

    db.session.commit()
    update_player_orders_by_point()
    return jsonify({"success": True, "message": "선택한 베팅이 승인되었습니다."})

@current_app.route('/delete_bettings', methods=['POST'])
def delete_bettings():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'success': False, 'message': '삭제할 베팅이 선택되지 않았습니다.'}), 400
    
    bettings = Betting.query.filter(Betting.id.in_(ids), Betting.approved == True).all()
    bettings_pending = Betting.query.filter(Betting.id.in_(ids), Betting.approved == False).all()

    for betting in bettings:
        if betting.approved:
            match = Match.query.filter(Match.id == betting.result).first()
            if not match:
                continue
            
            winner = Player.query.get(match.winner)
            loser = Player.query.get(match.loser)
            if not winner or not loser:
                continue
            
            participants = betting.participants
            for participant in participants:
                participated_player = Player.query.filter_by(id=participant.participant_id).first()
                participated_player.betting_count += betting.point
            
            winner_participants = [
                Player.query.filter_by(id=participant.participant_id).first()
                for participant in participants
                if participant.winner_id == winner.id
            ]
            total_sharers = 1 + len(winner_participants)
            
            total_points = betting.point * (2 + len(participants))
            winner_points = total_points + (total_points % (1 + len([p for p in participants if p.winner_id == winner.id])))
            
            share = winner_points // total_sharers
            
            for winner_participant in winner_participants:
                if winner_participant:
                    winner_participant.betting_count -= share
            
            winner.betting_count -= share
            
            winner.betting_count += betting.point
            loser.betting_count += betting.point
    
    Betting.query.filter(Match.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    update_player_orders_by_point()
    
    return jsonify({'success': True, 'message': f'{len(bettings)}개의 승인된 베팅과 {len(bettings_pending)}개의 미승인된 베팅이 삭제되었습니다.'})

@current_app.route('/select_all_bettings', methods=['GET'])
def select_all_bettings():
    bettings = Betting.query.filter_by(approved=False).all()
    result = [betting.id for betting in bettings]
    return jsonify({'ids': result})


# approval.js

@current_app.route('/get_matches', methods=['GET'])
def get_matches():
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', 30))
    tab = request.args.get('tab', 'all')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Match.query.order_by(Match.approved, Match.timestamp.desc())
    
    if tab == 'pending':
        query = query.filter(Match.approved == False)
    elif tab == 'approved':
        query = query.filter(Match.approved == True)
    
    if start_date and end_date:
        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").replace(hour=00, minute=00, second=00)
            end_date = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(Match.timestamp >= start_date, Match.timestamp <= end_date)
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    matches = query.offset(offset).limit(limit).all()
    
    response = [
        {
            'id': match.id,
            'winner_name': match.winner_name,
            'loser_name': match.loser_name,
            'score': match.score,
            'approved': match.approved,
            'timestamp': match.timestamp
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

def update_player_orders_by_match():
    categories = [
        ('win_order', Player.win_count.desc()),
        ('loss_order', Player.loss_count.desc()),
        ('match_order', Player.match_count.desc()),
        ('rate_order', Player.rate_count.desc()),
        ('opponent_order', Player.opponent_count.desc()),
    ]

    for order_field, primary_criteria in categories:
        players = Player.query.filter(Player.is_valid == True).order_by(primary_criteria).all()
        
        current_rank = 0
        previous_primary_value = None
        
        primary_field_name = primary_criteria.element.name

        for i, player in enumerate(players, start=1):
            primary_value = getattr(player, primary_field_name)
            if primary_value != previous_primary_value:
                current_rank = i
                previous_primary_value = primary_value
            
            setattr(player, order_field, current_rank)

    db.session.commit()
    
@current_app.route('/approve_matches', methods=['POST'])
def approve_matches():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'success': False, 'message': '승인할 경기가 선택되지 않았습니다.'}), 400
    
    matches = Match.query.filter(Match.id.in_(ids), Match.approved == False).all()

    for match in matches:
        winner = Player.query.get(match.winner)
        loser = Player.query.get(match.loser)
        if not winner or not loser:
            continue
        
        winner.match_count += 1
        winner.win_count += 1
        winner.rate_count = round((winner.win_count / winner.match_count) * 100, 2)
        winner_previous_opponent = winner.opponent_count
        winner.opponent_count = calculate_opponent_count(winner.id)
        
        winner.betting_count += 1
        
        loser.match_count += 1
        loser.loss_count += 1
        loser.rate_count = round((loser.win_count / loser.match_count) * 100, 2)
        loser_previous_opponent = loser.opponent_count
        loser.opponent_count = calculate_opponent_count(loser.id)
        
        loser.betting_count += 1
        
        if winner.match_count == 30: winner.betting_count += 5; winner.achieve_count += 5
        if winner.match_count == 50: winner.betting_count += 10; winner.achieve_count += 10
        if winner.match_count == 70: winner.betting_count += 20; winner.achieve_count += 20
        if winner.match_count == 100: winner.betting_count += 30; winner.achieve_count += 30
        if winner.win_count == 30: winner.betting_count += 10; winner.achieve_count += 10
        if winner.win_count == 50: winner.betting_count += 20; winner.achieve_count += 20
        if winner.win_count == 70: winner.betting_count += 30; winner.achieve_count += 30
        
        if winner_previous_opponent == 9 and winner.opponent_count == 10: winner.betting_count += 5; winner.achieve_count += 5
        if winner_previous_opponent == 29 and winner.opponent_count == 30: winner.betting_count += 20; winner.achieve_count += 20
        if winner_previous_opponent == 49 and winner.opponent_count == 50: winner.betting_count += 30; winner.achieve_count += 30
        
        if loser.match_count == 30: loser.betting_count += 5; loser.achieve_count += 5
        if loser.match_count == 50: loser.betting_count += 10; loser.achieve_count += 10
        if loser.match_count == 70: loser.betting_count += 20; loser.achieve_count += 20
        if loser.match_count == 100: loser.betting_count += 30; loser.achieve_count += 30
        if loser.loss_count == 30: loser.betting_count += 10; loser.achieve_count += 10
        if loser.loss_count == 50: loser.betting_count += 20; loser.achieve_count += 20
        if loser.loss_count == 70: loser.betting_count += 30; loser.achieve_count += 30

        if loser_previous_opponent == 9 and loser.opponent_count == 10: loser.betting_count += 5; loser.achieve_count += 5
        if loser_previous_opponent == 29 and loser.opponent_count == 30: loser.betting_count += 20; loser.achieve_count += 20
        if loser_previous_opponent == 49 and loser.opponent_count == 50: loser.betting_count += 30; loser.achieve_count += 30
        
        if winner.rank is not None and loser.rank is not None:
            if winner.rank - loser.rank == 8:
                winner.betting_count += 30
                winner.achieve_count += 30
            if loser.rank - winner.rank == 8:
                loser.betting_count += 3
                loser.achieve_count += 3
        
        today_partner = TodayPartner.query.filter_by(p1_id=match.winner, p2_id=match.loser, submitted=True).first()
        if not today_partner:
            today_partner = TodayPartner.query.filter_by(p1_id=match.loser, p2_id=match.winner, submitted=True).first()
        
        if today_partner:
            winner.betting_count += 5
            loser.betting_count += 5
        
        if match.timestamp.weekday() == 6:
            winner.achieve_count += 1; winner.betting_count += 1
            loser.achieve_count += 1; loser.betting_count += 1
        
        match.approved = True
        
    db.session.commit()
    update_player_orders_by_match()
    update_player_orders_by_point()
    return jsonify({'success': True, 'message': f'{len(matches)}개의 경기가 승인되었습니다.'})

@current_app.route('/delete_matches', methods=['POST'])
def delete_matches():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'success': False, 'message': '삭제할 경기가 선택되지 않았습니다.'}), 400
    
    matches = Match.query.filter(Match.id.in_(ids), Match.approved == True).all()
    matches_pending = Match.query.filter(Match.id.in_(ids), Match.approved == False).all()

    for match in matches:
        if match.approved:
            winner = Player.query.get(match.winner)
            loser = Player.query.get(match.loser)
            if not winner or not loser:
                continue
            
            winner.match_count -= 1
            winner.win_count -= 1
            winner.rate_count = round((winner.win_count / winner.match_count) * 100, 2) if winner.match_count > 0 else 0
            winner_previous_opponent = winner.opponent_count
            winner.opponent_count = calculate_opponent_count(winner.id)
            
            winner.betting_count -= 1

            loser.match_count -= 1
            loser.loss_count -= 1
            loser.rate_count = round((loser.win_count / loser.match_count) * 100, 2) if loser.match_count > 0 else 0
            loser_previous_opponent = loser.opponent_count
            loser.opponent_count = calculate_opponent_count(loser.id)
            
            loser.betting_count -= 1
            
            if winner.match_count == 29: winner.betting_count -= 5; winner.achieve_count -= 5
            if winner.match_count == 49: winner.betting_count -= 10; winner.achieve_count -= 10
            if winner.match_count == 69: winner.betting_count -= 20; winner.achieve_count -= 20
            if winner.match_count == 99: winner.betting_count -= 30; winner.achieve_count -= 30
            if winner.win_count == 29: winner.betting_count -= 10; winner.achieve_count -= 10
            if winner.win_count == 49: winner.betting_count -= 20; winner.achieve_count -= 20
            if winner.win_count == 69: winner.betting_count -= 30; winner.achieve_count -= 30
            
            if winner_previous_opponent == 10 and winner.opponent_count == 9: winner.betting_count -= 5; winner.achieve_count -= 5
            if winner_previous_opponent == 30 and winner.opponent_count == 29: winner.betting_count -= 20; winner.achieve_count -= 20
            if winner_previous_opponent == 50 and winner.opponent_count == 49: winner.betting_count -= 30; winner.achieve_count -= 30
            
            if loser.match_count == 29: loser.betting_count -= 5; loser.achieve_count -= 5
            if loser.match_count == 49: loser.betting_count -= 10; loser.achieve_count -= 10
            if loser.match_count == 69: loser.betting_count -= 20; loser.achieve_count -= 20
            if loser.match_count == 99: loser.betting_count -= 30; loser.achieve_count -= 30
            if loser.loss_count == 29: loser.betting_count -= 10; loser.achieve_count -= 10
            if loser.loss_count == 49: loser.betting_count -= 20; loser.achieve_count -= 20
            if loser.loss_count == 69: loser.betting_count -= 30; loser.achieve_count -= 30

            if loser_previous_opponent == 10 and loser.opponent_count == 9: loser.betting_count -= 5; loser.achieve_count -= 5
            if loser_previous_opponent == 30 and loser.opponent_count == 29: loser.betting_count -= 20; loser.achieve_count -= 20
            if loser_previous_opponent == 50 and loser.opponent_count == 49: loser.betting_count -= 30; loser.achieve_count -= 30
            
            if winner.rank is not None and loser.rank is not None:
                if winner.rank - loser.rank == 8:
                    winner.betting_count -= 30
                    winner.achieve_count -= 30
                if loser.rank - winner.rank == 8:
                    loser.betting_count -= 3
                    loser.achieve_count -= 3  

            today_partner = TodayPartner.query.filter_by(p1_id=match.winner, p2_id=match.loser, submitted=True).first()
            if not today_partner:
                today_partner = TodayPartner.query.filter_by(p1_id=match.loser, p2_id=match.winner, submitted=True).first()
            
            if today_partner:
                winner.betting_count -= 5
                loser.betting_count -= 5
            
            if match.timestamp.weekday() == 6:
                winner.achieve_count -= 1; winner.betting_count -= 1
                loser.achieve_count -= 1; loser.betting_count -= 1
                
    Match.query.filter(Match.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    update_player_orders_by_match()
    update_player_orders_by_point()
    
    return jsonify({'success': True, 'message': f'{len(matches)}개의 승인된 경기와 {len(matches_pending)}개의 미승인된 경기가 삭제되었습니다.'})

@current_app.route('/select_all_matches', methods=['GET'])
def select_all_matches():
    matches = Match.query.filter_by(approved=False).all()
    result = [match.id for match in matches]
    return jsonify({'ids': result})


# assignment.js

@current_app.route('/logs', methods=['GET'])
def get_logs():
    logs = UpdateLog.query.order_by(UpdateLog.timestamp.desc()).all()
    return jsonify([{'id': log.id, 'title': log.title} for log in logs])

@current_app.route('/update_ranks', methods=['POST'])
def update_ranks():
    try:
        players = Player.query.filter(Player.is_valid == True, Player.match_count >= 5).order_by(
            Player.rate_count.desc(), Player.match_count.desc()
        ).all()

        total_players = len(players)
        cal_quotas = [round(total_players * p) for p in [0.05, 0.12, 0.21, 0.32, 0.44, 0.56, 0.68, 0.80, 1.00]]
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
                
        cutline = []
        for rank in range(1, 10):
            lowest_player = (
                Player.query.filter(Player.is_valid == True, Player.previous_rank == rank)
                .order_by(Player.rate_count)
                .first()
            )
            if lowest_player:
                cutline.append({'rank': rank, 'rate_count': lowest_player.rate_count})
            else:
                cutline.append({'rank': rank, 'rate_count': 0})

        for player in Player.query.filter(Player.is_valid == True, Player.match_count < 10).all():
            player.previous_rank = None

        for player in players:
            if player.previous_rank is None:
                player.rank_change = None
            elif player.rank is None:
                player.rank_change = 'New'
            elif player.previous_rank < player.rank:
                player.rank_change = 'Up'
                if player.rank - player.previous_rank >= 1: player.betting_count += 2; player.achieve_count +=2
                if player.rank - player.previous_rank >= 2: player.betting_count += 3; player.achieve_count +=3
            elif player.previous_rank > player.rank:
                player.rank_change = 'Down'
                if player.previous_rank - player.rank >= 2: player.betting_count += 3; player.achieve_count +=3
            else:
                player.rank_change = None

        update_player_orders_by_point()
        
        cutline_table_rows = [
            f"""
            <tr>
                <td class=\"border border-gray-300 p-2\">{rank_line['rank']}부</td>
                <td class=\"border border-gray-300 p-2\">{rank_line['rate_count']}%</td>
            </tr>
            """
            for rank_line in cutline
        ]
        
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
            for p in Player.query.filter(Player.is_valid == True, Player.rank_change.isnot(None)).order_by(Player.rate_count.desc()).all()
        ]

        html_content = f"""
        <div class="bg-gray-100">
            <table class="w-full bg-white border-collapse border border-gray-300 text-center mb-4">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border border-gray-300 p-2">{total_players}명</th>
                        <th class="border border-gray-300 p-2">승률</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(cutline_table_rows)}
                </tbody>
            </table>
            <table class="w-full bg-white border-collapse border border-gray-300 text-center mb-4">
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

        current_time = datetime.now(ZoneInfo("Asia/Seoul"))
        
        log = UpdateLog(title=str(current_time.date()), html_content=html_content, timestamp=current_time)
        db.session.add(log)

        for player in Player.query.filter(Player.is_valid == True, Player.rank_change.isnot(None)).all():
            player.rank = player.previous_rank
            
        for player in Player.query.all():
            player.previous_rank = None
            player.rank_change = None

        db.session.commit()
        return jsonify({'success': True, 'message': '부수 업데이트가 완료되었습니다.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    
@current_app.route('/revert_log', methods=['POST'])
def revert_log():
    try:
        players = Player.query.filter(Player.match_count >= 5).order_by(
            Player.rate_count.desc(), Player.match_count.desc()
        ).all()

        total_players = len(players)
        
        log_id = request.json.get('log_id')
        log = UpdateLog.query.get(log_id)

        if not log:
            return jsonify({'success': False, 'message': '로그를 찾을 수 없습니다.'})

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(log.html_content, 'html.parser')
        tables = soup.find_all('table')
        if len(tables) > 1:
            target_table = tables[1]
        else:
            target_table = tables[0]
        rows = target_table.find('tbody').find_all('tr')
        
        rank_map = {}
        for row in rows:
            columns = row.find_all('td')
            name = columns[0].text.strip()
            previous_rank = columns[1].text.strip()
            current_rank = columns[2].text.strip()
            change = columns[4].text.strip()
            
            if change == "New":
                change = None
            elif change == "Up":
                change = "Down"
            elif change == "Down":
                change = "Up"
            elif change == "":
                change = "New"

            rank_map[name] = {
                'previous_rank': None if current_rank == '무' else int(current_rank),
                'rank': None if previous_rank == '무' else int(previous_rank),
                'rank_change': change
            }

        for player in Player.query.filter(Player.name.in_(rank_map.keys())).all():
            player.previous_rank = rank_map[player.name]['previous_rank']
            player.rank = rank_map[player.name]['rank']
            player.rank_change = rank_map[player.name]['rank_change']

        db.session.commit()

        table_rows = [
            f"""
            <tr>
                <td class="border border-gray-300 p-2">{player.name}</td>
                <td class="border border-gray-300 p-2">{player.previous_rank or '무'}</td>
                <td class="border border-gray-300 p-2">{player.rank or '무'}</td>
                <td class="border border-gray-300 p-2">{player.rate_count}%</td>
                <td class="border border-gray-300 p-2">{player.rank_change or ''}</td>
            </tr>
            """
            for player in Player.query.order_by(Player.rate_count.desc()).filter(Player.name.in_(rank_map.keys())).all()
        ]

        html_content = f"""
        <div class="bg-gray-100">
            <table class="w-full bg-white border-collapse border border-gray-300 text-center">
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
        
        current_time = datetime.now(ZoneInfo("Asia/Seoul"))
        
        new_log = UpdateLog(title=f"복원 - {current_time.date()}", html_content=html_content, timestamp=current_time)
        db.session.add(new_log)
        
        for player in Player.query.filter(Player.name.in_(rank_map.keys())).all():
            player.previous_rank = None
            player.rank_change = None
        
        db.session.commit()

        return jsonify({'success': True, 'message': '이전 상태로 복원되었습니다.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})    
    
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


# settings.js

@current_app.route('/reset_partner', methods=['POST'])
def reset_partner():
    try:
        TodayPartner.query.delete()
        db.session.commit()
        return "오늘의 상대 초기화 완료", 200
    except Exception as e:
        print(e)
        return "초기화 실패", 500

@current_app.route('/register_partner', methods=['POST'])
def register_partner():
    data = request.json
    old_players = data.get('old_players', [])
    new_players = data.get('new_players', [])

    if not old_players or not new_players:
        return jsonify({"error": "부원 이름이 필요합니다."}), 400

    pairs = []
    old_count = len(old_players)
    for i, new_player in enumerate(new_players):
        old_player = old_players[i % old_count]
        pairs.append({"p1_name": old_player, "p2_name": new_player})

    TodayPartner.query.delete()
    db.session.commit()

    return jsonify(pairs), 200

@current_app.route('/submit_partner', methods=['POST'])
def submit_partner():
    data = request.json
    pairs = data.get('pairs', [])

    try:
        TodayPartner.query.delete()

        for pair in pairs:
            p1_name = pair['p1_name']
            p2_name = pair['p2_name']

            p1 = Player.query.filter_by(name=p1_name).first()
            p2 = Player.query.filter_by(name=p2_name).first()

            if not p1 or not p2:
                return jsonify({"error": f"{p1_name if not p1 else p2_name}의 정보를 찾을 수 없습니다."}), 400

            today_partner = TodayPartner(
                p1_id=p1.id,
                p1_name=p1.name,
                p2_id=p2.id,
                p2_name=p2.name
            )
            db.session.add(today_partner)

        db.session.commit()
        return "오늘의 상대 저장 완료", 200
    except Exception as e:
        print(e)
        return jsonify({"error": "저장 중 문제가 발생했습니다."}), 500
    
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
    players = Player.query.order_by(Player.is_valid.desc(), Player.name).all()
    response = []
    for player in players:
        response.append({
            'id': player.id,
            'name': player.name,
            'win_count': player.win_count,
            'rate_count': player.rate_count,
            'match_count': player.match_count,
            'achieve_count': player.achieve_count,
            'betting_count': player.betting_count,
            'is_valid': player.is_valid
        })
    return jsonify(response)

@current_app.route('/toggle_validity', methods=['POST'])
def toggle_validity():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'success': False, 'message': '선택된 항목이 없습니다.'}), 400

    players = Player.query.filter(Player.id.in_(ids)).all()
    for player in players:
        player.is_valid = not player.is_valid

    db.session.commit()
    update_player_orders_by_match()
    update_player_orders_by_point()
    return jsonify({'success': True})

@current_app.route('/delete_players', methods=['POST'])
def delete_players():
    data = request.get_json()
    ids = data.get('ids', [])

    Player.query.filter(Player.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    update_player_orders_by_match()
    update_player_orders_by_point()
    return jsonify({'success': True})

@current_app.route('/update_achievement', methods=['POST'])
def update_achievement():
    data = request.get_json()
    player_id = data.get('player_id')
    additional_achievements = data.get('achievements', 0)
    additional_betting = data.get('betting', 0)

    if not player_id or (additional_achievements == 0 and additional_betting == 0):
        return jsonify({'success': False, 'error': 'Invalid data provided'}), 400

    player = Player.query.get(player_id)
    if not player:
        return jsonify({'success': False, 'error': 'Player not found'}), 404

    if additional_achievements != 0:
        player.achieve_count += additional_achievements
    
    if additional_betting != 0:
        player.betting_count += additional_betting
    
    db.session.commit()
    update_player_orders_by_point()

    return jsonify({'success': True, 'new_achieve_count': player.achieve_count, 'new_betting_count': player.betting_count})


# league.js

@current_app.route('/get_leagues', methods=['GET'])
def get_leagues():
    leagues = League.query.order_by(League.id.desc()).all()
    response = []
    for league in leagues:
        response.append({
            'id': league.id,
            'p1': league.p1,
            'p2': league.p2,
            'p3': league.p3,
            'p4': league.p4,
            'p5': league.p5
        })
    
    return jsonify(response)

@current_app.route('/create_league', methods=['POST'])
def create_league():
    data = request.get_json()
    if not data or 'players' not in data:
        return jsonify({'error': '올바른 데이터를 제공해주세요.'}), 400

    players = data.get('players', [])
    if len(players) != 5:
        return jsonify({'error': '정확히 5명의 선수를 입력해야 합니다.'}), 400

    for name in players:
        player = Player.query.filter_by(name=name).first()
        if not player or not player.is_valid:
            return jsonify({'success': False, 'error': f'선수 "{name}"를 찾을 수 없습니다.'}), 400

    new_league = League(
        p1=players[0],
        p2=players[1],
        p3=players[2],
        p4=players[3],
        p5=players[4]
    )
    db.session.add(new_league)
    db.session.commit()

    return jsonify({'success': True, 'message': '리그전이 생성되었습니다.', 'league_id': new_league.id})


# league_detail.js

@current_app.route('/save_league/<int:league_id>', methods=['POST'])
def save_league(league_id):
    data = request.get_json()
    league = League.query.get_or_404(league_id)

    scores = data.get('scores', {})
    for key, value in scores.items():
        if hasattr(league, key):
            setattr(league, key, value)

    db.session.commit()
    return jsonify({'success': True})

@current_app.route('/delete_league/<int:league_id>', methods=['DELETE'])
def delete_league(league_id):
    league = League.query.get(league_id)

    if not league:
        return jsonify({'success': False, 'error': '리그를 찾을 수 없습니다.'}), 404

    try:
        db.session.delete(league)
        db.session.commit()
        return jsonify({'success': True, 'message': '리그가 성공적으로 삭제되었습니다.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'리그 삭제 중 오류 발생: {str(e)}'}), 500
    
    
# betting.js

@current_app.route('/get_players_ranks', methods=['POST'])
def get_players_ranks():
    data = request.get_json()
    players = data.get('players', [])
    
    p1 = Player.query.filter_by(name=players[0]).first()
    p2 = Player.query.filter_by(name=players[1]).first()
    
    if not p1 or not p2:
        return jsonify({'error': '선수를 찾을 수 없습니다.'}), 400
    
    if p1.rank is not None and p2.rank is not None:
        rank_gap = abs(p1.rank - p2.rank)
    else: 
        rank_gap = None
    
    response = {
        'p1_rank': p1.rank,
        'p2_rank': p2.rank,
        'rank_gap': rank_gap
    }
    
    return jsonify(response)

@current_app.route('/get_betting_counts', methods=['POST'])
def get_betting_counts():
    data = request.get_json()
    players = data.get('players', [])
    participants = data.get('participants', [])
    
    p1 = Player.query.filter_by(name=players[0]).first()
    p2 = Player.query.filter_by(name=players[1]).first()

    if not p1 or not p2:
        return jsonify({'error': '선수를 찾을 수 없습니다.'}), 400

    participant_data = []
    for participant_name in participants:
        participant = Player.query.filter_by(name=participant_name.strip()).first()
        if participant:
            if participant.name == p1.name or participant.name == p2.name:
                continue
            
            participant_data.append({
                'name': participant.name,
                'betting_count': participant.betting_count
            })
        else:
            return jsonify({'error': f'베팅 참가자 "{participant.name}"을/를 찾을 수 없습니다.'}), 400

    return jsonify({
        'p1': {'name': p1.name, 'betting_count': p1.betting_count},
        'p2': {'name': p2.name, 'betting_count': p2.betting_count},
        'participants': participant_data
    })

@current_app.route('/create_betting', methods=['POST'])
def create_betting():
    data = request.get_json()
    players = data.get('players', [])
    participants = data.get('participants', [])
    point = data.get('point')

    if len(players) != 2:
        return jsonify({'error': '정확히 2명의 선수를 입력해야 합니다.'}), 400

    if not isinstance(point, int) or point <= 0:
        return jsonify({'error': '유효한 점수를 입력하세요.'}), 400

    p1 = Player.query.filter_by(name=players[0]).first()
    p2 = Player.query.filter_by(name=players[1]).first()

    if not p1 or not p2:
        return jsonify({'error': '선수를 찾을 수 없습니다.'}), 400

    new_betting = Betting(
        p1_id=p1.id,
        p1_name=p1.name,
        p2_id=p2.id,
        p2_name=p2.name,
        point=point
    )
    db.session.add(new_betting)
    db.session.flush()

    for participant_name in participants:
        participant = Player.query.filter_by(name=participant_name.strip()).first()
        if participant:
            if participant.name == p1.name or participant.name == p2.name:
                continue
            
            betting_participant = BettingParticipant(
                betting_id=new_betting.id,
                participant_name=participant_name.strip(),
                participant_id=participant.id
            )
            db.session.add(betting_participant)

    db.session.commit()

    return jsonify({'success': True, 'message': '베팅이 생성되었습니다.', 'betting_id': new_betting.id})


# betting_detail.js

@current_app.route('/betting/<int:betting_id>/delete', methods=['DELETE'])
def delete_betting(betting_id):
    betting = Betting.query.get_or_404(betting_id)
    db.session.delete(betting)
    db.session.commit()
    return jsonify({'success': True})

@current_app.route('/betting/<int:betting_id>/update', methods=['POST'])
def update_betting(betting_id):
    data = request.get_json()
    participants = data.get('participants', [])

    if not participants:
        return jsonify({'error': '참가자 데이터가 제공되지 않았습니다.'}), 400

    try:
        participants = sorted(participants, key=lambda x: x.get('id'))
        
        for participant_data in participants:
            participant_id = participant_data.get('id')
            winner_id = participant_data.get('winner')

            betting_participant = BettingParticipant.query.filter_by(
                betting_id=betting_id, participant_id=participant_id
            ).first()

            if betting_participant:
                betting_participant.winner_id = winner_id
        
        db.session.commit()
        return jsonify({'success': True, 'message': '베팅 데이터가 업데이트되었습니다.'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'서버 오류가 발생했습니다: {str(e)}'}), 500
    
@current_app.route('/submit_betting_result', methods=['POST'])
def submit_betting_result():
    data = request.get_json()

    betting_id = data.get('bettingId')
    p1_name = data.get('p1Name')
    p2_name = data.get('p2Name')
    winner_name = data.get('winnerName')
    score = data.get('score')

    if not (betting_id and p1_name and p2_name and winner_name):
        return jsonify({"error": "모든 필드를 입력해주세요."}), 400

    betting = Betting.query.filter_by(id=betting_id).first()
    if not betting:
        return jsonify({"error": "해당 베팅을 찾을 수 없습니다."}), 404

    if not (betting.p1_name == p1_name and betting.p2_name == p2_name) and not (betting.p1_name == p2_name and betting.p2_name == p1_name):
        return jsonify({"error": "입력된 이름이 베팅 정보와 일치하지 않습니다."}), 400

    submit_match_response = submit_match_internal({
        "winner": winner_name,
        "loser": p1_name if winner_name == p2_name else p2_name,
        "score": score
    })

    if submit_match_response.get("error"):
        return jsonify({"error": "경기 결과를 제출하는 데 실패했습니다: " + submit_match_response["error"]}), 400

    match_id = submit_match_response.get("match_id")
    if not match_id:
        return jsonify({"error": "경기 ID를 가져오지 못했습니다."}), 500

    betting.result = match_id
    db.session.add(betting)

    participants = betting.participants
    winner = Player.query.filter_by(name=winner_name).first()
    
    if winner is None:
        return jsonify({"error": "승자 이름이 잘못되었습니다."}), 400

    total_points = betting.point * (2 + len(participants))
    winner_points = total_points + (total_points % (1 + len([p for p in participants if p.winner_id == winner.id])))
    
    winner_participants = [p for p in participants if p.winner_id == winner.id]
    win_participants_names = [p.participant_name for p in winner_participants]
    total_sharers = 1 + len(winner_participants)
    
    share = winner_points // total_sharers
    
    betting.submitted = True
    
    db.session.commit()

    return jsonify({
        "message": "베팅 결과가 성공적으로 처리되었습니다!",
        "results": {
            "winnerName": winner.name,
            "winParticipants": win_participants_names,
            "distributedPoints": share
        }
    }), 200

def submit_match_internal(match_data):
    winner_name = match_data.get("winner")
    loser_name = match_data.get("loser")
    score_value = match_data.get("score")

    if not winner_name or not loser_name or not score_value:
        return {"error": "잘못된 데이터"}

    winner = Player.query.filter_by(name=winner_name).first()
    if not winner:
        winner = Player(name=winner_name)
        db.session.add(winner)

    loser = Player.query.filter_by(name=loser_name).first()
    if not loser:
        loser = Player(name=loser_name)
        db.session.add(loser)

    db.session.flush()

    current_time = datetime.now(ZoneInfo("Asia/Seoul"))

    new_match = Match(
        winner=winner.id,
        winner_name=winner.name,
        loser=loser.id,
        loser_name=loser.name,
        score=score_value,
        timestamp=current_time,
        approved=False
    )
    db.session.add(new_match)
    db.session.commit()

    return {"match_id": new_match.id}


# partner.js

@current_app.route('/get_partners', methods=['GET'])
def get_partners():
    partners = TodayPartner.query.order_by(TodayPartner.submitted, TodayPartner.id).all()
    response = []
    for partner in partners:
        response.append({
            'p1_id': partner.p1_id,
            'p1_name': partner.p1_name,
            'p2_id': partner.p2_id,
            'p2_name': partner.p2_name,
            'submitted': partner.submitted
        })
    
    return jsonify(response)