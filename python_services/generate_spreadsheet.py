import xlsxwriter
import sys
import json

def generate_spreadsheet(data_json_string):
    # O Node.js irá nos passar o caminho do arquivo de saída como o primeiro argumento
    output_path = sys.argv[1]
    
    # Decodifica os dados JSON recebidos do Node.js
    try:
        data = json.loads(data_json_string)
    except json.JSONDecodeError:
        print("Erro: String JSON inválida recebida.", file=sys.stderr)
        sys.exit(1)

    # Cria a planilha
    workbook = xlsxwriter.Workbook(output_path)
    worksheet = workbook.add_worksheet()

    # Escreve os cabeçalhos
    if not data:
        # Se não houver dados, cria uma planilha vazia com cabeçalhos
        headers = ['ID', 'Descrição', 'Status', 'Data de Coleta']
    else:
        # Pega os cabeçalhos das chaves do primeiro objeto
        headers = list(data[0].keys())

    for col, header in enumerate(headers):
        worksheet.write(0, col, header)

    # Escreve os dados
    for row_num, row_data in enumerate(data, 1):
        for col_num, header in enumerate(headers):
            worksheet.write(row_num, col_num, row_data.get(header))

    workbook.close()
    # Imprime o caminho do arquivo para que o Node.js saiba onde encontrá-lo
    print(output_path)

if __name__ == '__main__':
    # Verifica se os argumentos necessários foram passados
    if len(sys.argv) != 3:
        print("Uso: python generate_spreadsheet.py <caminho_saida> '<dados_json>'", file=sys.stderr)
        sys.exit(1)
        
    # O segundo argumento agora é a string JSON com os dados
    json_data_arg = sys.argv[2]
    generate_spreadsheet(json_data_arg) 