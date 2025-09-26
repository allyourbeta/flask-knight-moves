from flask import render_template, request, session
from app import app
import random


def bishop_2_move_path(start, end):
    """Calculate a 2-move bishop path between squares"""
    def square_to_coord(square):
        return ord(square[0]) - 97, int(square[1]) - 1
    
    def coord_to_square(x, y):
        return chr(x + 97) + str(y + 1)
    
    start_x, start_y = square_to_coord(start)
    end_x, end_y = square_to_coord(end)
    
    # Find intermediate squares that work
    for mid_x in range(8):
        for mid_y in range(8):
            if mid_x == start_x and mid_y == start_y:
                continue
            if mid_x == end_x and mid_y == end_y:
                continue
                
            # Check if start->middle is diagonal
            dx1 = mid_x - start_x
            dy1 = mid_y - start_y
            if abs(dx1) != abs(dy1) or dx1 == 0:
                continue
                
            # Check if middle->end is diagonal  
            dx2 = end_x - mid_x
            dy2 = end_y - mid_y
            if abs(dx2) != abs(dy2) or dx2 == 0:
                continue
                
            # Found a valid 2-move path
            middle = coord_to_square(mid_x, mid_y)
            return [start, middle, end]
    
    return None

def bishop_path(start, end):
    """Calculate the path a bishop takes between two squares"""
    def square_to_coord(square):
        return ord(square[0]) - 97, int(square[1]) - 1
    
    def coord_to_square(x, y):
        return chr(x + 97) + str(y + 1)
    
    start_x, start_y = square_to_coord(start)
    end_x, end_y = square_to_coord(end)
    
    # Check if squares are on same diagonal
    dx = end_x - start_x
    dy = end_y - start_y
    
    if abs(dx) != abs(dy):
        return None  # Not on same diagonal, impossible move
    
    if dx == 0 and dy == 0:
        return [start]  # Same square
    
    # For single-move paths, only return start and end squares
    return [start, end]

def knight_path(start, end):
    def valid_moves(x, y):
        return [(x + 2, y + 1), (x + 2, y - 1), (x - 2, y + 1), (x - 2, y - 1),
                (x + 1, y + 2), (x + 1, y - 2), (x - 1, y + 2), (x - 1, y - 2)]

    def coord_to_square(x, y):
        return chr(x + 97) + str(y + 1)

    def square_to_coord(square):
        return ord(square[0]) - 97, int(square[1]) - 1

    start_x, start_y = square_to_coord(start)
    end_x, end_y = square_to_coord(end)

    queue = [(start_x, start_y, [start])]
    visited = set()

    while queue:
        x, y, path = queue.pop(0)
        if (x, y) == (end_x, end_y):
            return path

        if (x, y) not in visited:
            visited.add((x, y))
            for nx, ny in valid_moves(x, y):
                if 0 <= nx < 8 and 0 <= ny < 8:
                    queue.append((nx, ny, path + [coord_to_square(nx, ny)]))

    return None


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/knight_game', methods=['GET', 'POST'])
def knight_game():
    if request.method == 'POST':
        try:
            user_moves = int(request.form['user_moves'])
        except (ValueError, KeyError):
            error_message = "Invalid input. Please select a valid number of moves."
            square_a = session.get('square_a', 'a1')
            square_b = session.get('square_b', 'a2')
            return render_template('knight_game.html', square_a=square_a, square_b=square_b, message=error_message)
        correct_moves = session.get('correct_moves')
        square_a = session.get('square_a')
        square_b = session.get('square_b')
        path = session.get('path')

        if user_moves == correct_moves:
            message = f"Correct. The Knight can move from {square_a} to {square_b} in {correct_moves} move{'s' if correct_moves != 1 else ''}."
            return render_template('result.html', correct=True, message=message,
                                   square_a=square_a, square_b=square_b,
                                   correct_moves=correct_moves, piece="Knight",
                                   game_type='knight_game', path=path)
        else:
            # Track attempts for better UX feedback
            attempt_count = session.get('knight_attempts', 0) + 1
            session['knight_attempts'] = attempt_count
            
            if attempt_count == 1:
                error_message = "Incorrect. Try again."
            elif attempt_count == 2:
                error_message = "Still incorrect. Think about the knight's L-shaped moves."
            elif attempt_count == 3:
                error_message = "Not quite right. Remember, knights move in an L: 2 squares in one direction, 1 in perpendicular."
            else:
                error_message = f"Incorrect attempt #{attempt_count}. Keep trying - you've got this."
            
            return render_template('knight_game.html', square_a=square_a, square_b=square_b, message=error_message)

    files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    ranks = ['1', '2', '3', '4', '5', '6', '7', '8']
    square_a = random.choice(files) + random.choice(ranks)
    square_b = random.choice(files) + random.choice(ranks)

    while square_b == square_a:
        square_b = random.choice(files) + random.choice(ranks)

    path = knight_path(square_a, square_b)
    correct_moves = len(path) - 1

    session['correct_moves'] = correct_moves
    session['square_a'] = square_a
    session['square_b'] = square_b
    session['path'] = path
    session['knight_attempts'] = 0  # Reset attempt counter for new game

    return render_template('knight_game.html', square_a=square_a, square_b=square_b)

@app.route('/bishop_game', methods=['GET', 'POST'])
def bishop_game():
    if request.method == 'POST':
        try:
            user_moves = int(request.form['user_moves'])
        except (ValueError, KeyError):
            error_message = "Invalid input. Please select a valid number of moves."
            square_a = session.get('square_a', 'a1')
            square_b = session.get('square_b', 'a2')
            return render_template('bishop_game.html', square_a=square_a, square_b=square_b, message=error_message)
        correct_moves = session.get('correct_moves')
        square_a = session.get('square_a')
        square_b = session.get('square_b')
        path = session.get('bishop_path')

        if user_moves == correct_moves:
            if correct_moves == -1:
                message = "Correct. The Bishop cannot change colors."
            else:
                message = f"Correct. The Bishop can move from {square_a} to {square_b} in {correct_moves} move{'s' if correct_moves != 1 else ''}."
            return render_template('result.html', correct=True, message=message,
                                   square_a=square_a, square_b=square_b,
                                   correct_moves=correct_moves, piece="Bishop",
                                   start_square=square_a, end_square=square_b,
                                   path=path, game_type='bishop_game')
        else:
            # Track attempts for better UX feedback
            attempt_count = session.get('bishop_attempts', 0) + 1
            session['bishop_attempts'] = attempt_count
            
            if attempt_count == 1:
                error_message = "Incorrect. Try again."
            elif attempt_count == 2:
                error_message = "Still incorrect. Think about diagonal movement patterns."
            elif attempt_count == 3:
                error_message = "Not quite right. Bishops only move diagonally and can't change square colors."
            else:
                error_message = f"Incorrect attempt #{attempt_count}. Consider the diagonal paths."
            
            return render_template('bishop_game.html', square_a=square_a, square_b=square_b, message=error_message)

    files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    ranks = ['1', '2', '3', '4', '5', '6', '7', '8']
    square_a = random.choice(files) + random.choice(ranks)
    square_b = random.choice(files) + random.choice(ranks)

    while square_b == square_a:
        square_b = random.choice(files) + random.choice(ranks)


    file_diff = abs(files.index(square_a[0]) - files.index(square_b[0]))
    rank_diff = abs(int(square_a[1]) - int(square_b[1]))

    # Calculate the actual path
    if file_diff == rank_diff and file_diff > 0:
        # Direct diagonal - 1 move
        correct_moves = 1
        path = bishop_path(square_a, square_b)
    elif (file_diff + rank_diff) % 2 == 0:
        # Same color squares - 2 moves possible
        correct_moves = 2
        path = bishop_2_move_path(square_a, square_b)
    else:
        # Different color squares - impossible
        correct_moves = -1
        path = None

    session['correct_moves'] = correct_moves
    session['square_a'] = square_a
    session['square_b'] = square_b
    session['bishop_path'] = path
    session['bishop_attempts'] = 0  # Reset attempt counter for new game

    return render_template('bishop_game.html', square_a=square_a, square_b=square_b)


@app.route('/color_game', methods=['GET', 'POST'])
def color_game():
    if request.method == 'POST':
        user_color = request.form['color']
        correct_color = session.get('correct_color')
        square = session.get('square')

        if user_color == correct_color:
            message = f"Correct. {square} is a {correct_color} square."
            return render_template('result.html', correct=True, message=message,
                                   square_a=square, correct_color=correct_color,
                                   start_square=square, end_square=square,
                                   piece="Square", game_type='color_game')
        else:
            # Track attempts for better UX feedback
            attempt_count = session.get('color_attempts', 0) + 1
            session['color_attempts'] = attempt_count
            
            if attempt_count == 1:
                error_message = "Incorrect. Try again."
            elif attempt_count == 2:
                error_message = "Still incorrect. Think about the checkerboard pattern."
            elif attempt_count == 3:
                error_message = "Not quite right. Remember: a1 is a dark square, pattern alternates from there."
            else:
                error_message = f"Incorrect attempt #{attempt_count}. Visualize the board pattern."
            
            return render_template('color_game.html', square=square, message=error_message)

    # Generate a random square
    files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    ranks = ['1', '2', '3', '4', '5', '6', '7', '8']
    square = random.choice(files) + random.choice(ranks)

    # Determine the correct color
    file_index = files.index(square[0])
    rank_index = int(square[1]) - 1
    correct_color = 'dark' if (file_index + rank_index) % 2 == 0 else 'light'  # Fixed color determination

    # Store the correct answer in the session
    session['correct_color'] = correct_color
    session['square'] = square
    session['color_attempts'] = 0  # Reset attempt counter for new game

    return render_template('color_game.html', square=square)