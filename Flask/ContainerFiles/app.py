import mysql.connector
from flask import Flask, render_template, request, redirect, jsonify
from flask_bcrypt import Bcrypt
from flask_login import UserMixin, login_user, current_user, login_required, logout_user, LoginManager
import secrets
import datetime

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # Generates a random 32-character hexadecimal string

mysql_connection = mysql.connector.connect(
    host="DragonBlockMySQL",
    user="simple_user",
    password="password",
    database="dragonblock_db",
    port=3306,
)

bcrypt = Bcrypt(app)


login_manager = LoginManager(app)
login_manager.login_view = '/login-page'  # Specify the endpoint for the login page

class User(UserMixin):
    def __init__(self, email, username, password_hash, ethereum_address, birthday):
        self.id = email  # Use email as the user ID
        self.email = email
        self.username = username
        self.password_hash = password_hash
        self.ethereum_address = ethereum_address
        self.birthday = birthday


@login_manager.user_loader
def load_user(email):
    # Function to load user from the database using email
    db_cursor = mysql_connection.cursor(dictionary=True)
    db_cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user_data = db_cursor.fetchone()
    db_cursor.close()

    if user_data:
        return User(user_data['email'], user_data['username'], user_data['password_hash'], user_data['ethereum_address'], user_data['birthday'])
    return None



@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup-page')
def signup_page():
    return render_template('signup-page.html')

@app.route('/signup', methods=['POST'])
def signup():
    # Retrieve form data
    email = request.form.get('email')
    username = request.form.get('username')
    password = request.form.get('password')
    password_confirm = request.form.get('password-confirm')
    birthday = request.form.get('birthday')
    ethereum_address = request.form.get('ethereum-address')

    # Validate the form data
    if not email or not password or not password_confirm or not username or not ethereum_address or not birthday:
        error_msg = 'All fields are required.'
        return render_template('signup-page.html', error_msg=error_msg)

    if password != password_confirm:
        error_msg = 'Passwords do not match.'
        return render_template('signup-page.html', error_msg=error_msg)

    # Check if the email already exists
    db_cursor = mysql_connection.cursor(dictionary=True)
    db_cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    existing_user = db_cursor.fetchone()
    db_cursor.close()

    if existing_user:
        # Email already exists
        error_msg = 'Email already registered. Please use a different email.'
        return render_template('signup-page.html', error_msg=error_msg)

    # Hash the password
    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    # Convert the birthday to a MySQL-compatible date format
    birthday = datetime.datetime.strptime(birthday, '%Y-%m-%d').date().isoformat()


    # Insert user into the database
    db_cursor = mysql_connection.cursor(dictionary=True)
    db_cursor.execute("INSERT INTO users (email, username, password_hash, ethereum_address, birthday) VALUES (%s, %s, %s, %s, %s)", (email, username, password_hash, ethereum_address, birthday))
    mysql_connection.commit()
    db_cursor.close()

    # For now, just return a success message
    success_msg = 'Signup successful!'
    return render_template('signup-page.html', success_msg=success_msg)


@app.route('/login-page')
def login_page():
    return render_template('login-page.html')

@app.route('/login', methods=['POST'])
def login():
    # Retrieve form data
    email = request.form.get('email')
    password = request.form.get('password')

    # Validate the form data
    if not email or not password:
        error_msg = 'All fields are required.'
        return render_template('login-page.html', error_msg=error_msg)

    # Check if the user exists and verify the password
    db_cursor = mysql_connection.cursor(dictionary=True)
    db_cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = db_cursor.fetchone()
    db_cursor.close()

    if user and bcrypt.check_password_hash(user['password_hash'], password):
        # Successful login
        login_user(User(user['email'], user['username'], user['password_hash'], user['ethereum_address'], user['birthday']))
        return redirect('/home-page')
    else:
        # Invalid credentials
        error_msg = 'Invalid email or password.'
        return render_template('login-page.html', error_msg=error_msg)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/')


@app.route('/home-page')
@login_required
def home_page():
    return render_template('home-page.html', username=current_user.username)

@app.route('/profile-page')
@login_required
def profile_page():
    return render_template('profile-page.html', username=current_user.username, email=current_user.email, ethereum_address=current_user.ethereum_address, date_of_birth=current_user.birthday)

@app.route('/create-campaign')
@login_required
def create_campaign():
    return render_template('create-campaign.html')

@app.route('/save-campaign', methods=['POST'])
@login_required
def save_campaign():
    # Retrieve form data
    title = request.form.get('title')
    description = request.form.get('description')
    campaign_id = request.form.get('id')

    # Validate the form data
    if not title or not description or not campaign_id:
        error_msg = 'All fields are required.'
        return error_msg

    # Insert campaign into the CAMPAIGNS table
    db_cursor = mysql_connection.cursor(dictionary=True)
    db_cursor.execute("INSERT INTO campaigns (title, description, id) VALUES (%s, %s, %s)", (title, description, campaign_id))
    mysql_connection.commit()
    db_cursor.close()

    return 'success'

@app.route('/get-campaigns', methods=['POST'])
@login_required
def get_campaigns():
    data = request.get_json()
    campaign_ids = data.get('campaign_ids', [])

    # Replace this with your actual database logic to retrieve campaigns based on IDs
    db_cursor = mysql_connection.cursor(dictionary=True)

    # Use a WHERE clause to filter campaigns by specific IDs
    placeholders = ', '.join(['%s' for _ in campaign_ids])
    query = f"SELECT id, title, description FROM campaigns WHERE id IN ({placeholders})"
    db_cursor.execute(query, tuple(campaign_ids))  # Convert the list to a tuple
    
    campaigns = db_cursor.fetchall()
    db_cursor.close()

    # Return the result as JSON
    return jsonify(campaigns)

@app.route('/is-registered', methods=['POST'])
def is_registered():
    data = request.get_json()
    user_ethereum_address = data.get('ethereum_address')

    # Check if the email already exists
    db_cursor = mysql_connection.cursor(dictionary=True)
    db_cursor.execute("SELECT * FROM users WHERE ethereum_address = %s", (user_ethereum_address,))
    existing_user = db_cursor.fetchone()
    db_cursor.close()

    if existing_user:
        return jsonify(success=True)
    
    return jsonify(success=False)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=80)
