from flask import Flask, render_template, request, jsonify, send_file
import sqlite3
import csv
from io import StringIO

app = Flask(__name__, static_folder='static', template_folder='templates')

def conectar():
    return sqlite3.connect('dix.db')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login_adm():
    data = request.json
    usuario, senha = data.get('usuario'), data.get('senha')
    if usuario == "Cartel" and senha == "Cartel021@Summer":
        return jsonify({"sucesso": True})
    return jsonify({"sucesso": False, "mensagem": "Usuário ou senha inválidos."})

@app.route('/cupons', methods=['GET', 'POST'])
def cupons():
    conn = conectar()
    cursor = conn.cursor()
    if request.method == 'POST':
        cupom = request.json.get('cupom')
        cursor.execute("INSERT INTO cupons (cupom) VALUES (?)", (cupom,))
        conn.commit()
        return jsonify({"sucesso": True})
    else:
        cursor.execute("SELECT cupom FROM cupons")
        cupons = [row[0] for row in cursor.fetchall()]
        return jsonify(cupons)

@app.route('/solicitacao', methods=['POST'])
def solicitar():
    data = request.json
    conn = conectar()
    cursor = conn.cursor()
    deposito = float(data['deposito'])
    cupom = data.get('cupom', '').strip().lower()

    cursor.execute("SELECT 1 FROM cupons WHERE LOWER(cupom) = ?", (cupom,))
    cupom_existe = cursor.fetchone()

    if cupom_existe:
        valorFinal = round(deposito * 0.75, 2)
        status = "Cupom válido (25% desconto)"
    else:
        valorFinal = round(deposito * 0.70, 2)
        status = "Sem cupom ou inválido (30% desconto)"

    cursor.execute('''INSERT INTO solicitacoes 
        (nome, id, telefone, cupom, deposito, valorFinal, status, pago) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)''',
        (data['nome'], data['id'], data['telefone'], cupom, deposito, valorFinal, status))
    conn.commit()

    return jsonify({
        "cupom": cupom,
        "valorFinal": valorFinal,
        "status": status
    })

@app.route('/solicitacoes')
def listar_solicitacoes():
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT rowid, nome, id, telefone, cupom, deposito, valorFinal, status, pago FROM solicitacoes")
    dados = cursor.fetchall()
    resultado = [{
        "rowid": row[0], "nome": row[1], "id": row[2], "telefone": row[3],
        "cupom": row[4], "deposito": row[5], "valorFinal": row[6],
        "status": row[7], "pago": bool(row[8])
    } for row in dados]
    return jsonify(resultado)

@app.route('/solicitacao/<int:id>/pagar', methods=['POST'])
def marcar_pago(id):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("UPDATE solicitacoes SET pago = 1 WHERE rowid = ?", (id,))
    conn.commit()
    return jsonify({"status": "ok"})

@app.route('/exportar_csv')
def exportar_csv():
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM solicitacoes")
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([d[0] for d in cursor.description])
    writer.writerows(cursor.fetchall())
    output.seek(0)
    return send_file(output, mimetype='text/csv', download_name='solicitacoes.csv', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
