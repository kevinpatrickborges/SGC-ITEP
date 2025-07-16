import sys
import pandas as pd
import json

def read_excel_to_json(file_path):
    """
    Lê um arquivo Excel (.xlsx) e o converte para uma string JSON.

    Args:
        file_path (str): O caminho para o arquivo Excel.

    Returns:
        str: Uma string JSON representando os dados da planilha.
    """
    try:
        # Usa openpyxl como engine, que é bom para .xlsx
        df = pd.read_excel(file_path, engine='openpyxl')
        
        # Remove linhas que são completamente vazias
        df.dropna(how='all', inplace=True)
        
        # Converte colunas de data para o formato ISO 8601, que é amigável para JSON e JavaScript
        for col in df.select_dtypes(include=['datetime64']).columns:
            df[col] = df[col].dt.isoformat()
            
        # Converte o DataFrame para um dicionário e depois para JSON
        # O orient='records' cria uma lista de dicionários, um para cada linha
        return df.to_json(orient='records', date_format='iso')
        
    except FileNotFoundError:
        return json.dumps({"error": "Arquivo não encontrado.", "path": file_path})
    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    # O primeiro argumento (sys.argv[0]) é o nome do script.
    # O segundo (sys.argv[1]) é o caminho do arquivo que passaremos do Node.js.
    if len(sys.argv) > 1:
        file_path_arg = sys.argv[1]
        print(read_excel_to_json(file_path_arg))
    else:
        print(json.dumps({"error": "Nenhum caminho de arquivo fornecido."}))
