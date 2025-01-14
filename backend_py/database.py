import sqlite3
from flask import Flask, jsonify, request

app = Flask(__name__)
DATABASE = "example.db"

# Initialize the database
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT 0
            )
        """)
        conn.commit()

# Route: Home
@app.route("/")
def home():
    return jsonify({"message": "Welcome to the SQLite REST API!"})

# Route: Get all tasks
@app.route("/tasks", methods=["GET"])
def get_tasks():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks")
        rows = cursor.fetchall()
        tasks = [{"id": row[0], "task": row[1], "completed": bool(row[2])} for row in rows]
    return jsonify(tasks)

# Route: Add a new task
@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.json
    if not data or "task" not in data:
        return jsonify({"error": "Task content is required"}), 400

    task = data["task"]
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO tasks (task) VALUES (?)", (task,))
        conn.commit()
        task_id = cursor.lastrowid

    return jsonify({"id": task_id, "task": task, "completed": False}), 201

# Route: Get a specific task
@app.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()

    if row:
        task = {"id": row[0], "task": row[1], "completed": bool(row[2])}
        return jsonify(task)
    return jsonify({"error": "Task not found"}), 404

# Route: Update a task
@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Task not found"}), 404

        task = data.get("task", row[1])
        completed = data.get("completed", row[2])
        cursor.execute("UPDATE tasks SET task = ?, completed = ? WHERE id = ?", (task, completed, task_id))
        conn.commit()

    return jsonify({"id": task_id, "task": task, "completed": bool(completed)})

# Route: Delete a task
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Task not found"}), 404

        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()

    return jsonify({"message": "Task deleted"})

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
