#!/usr/bin/env python3
"""Config da CLI (~/.coffee.conf).

Arquivo opcional, no formato `CHAVE=valor`, uma por linha. Linhas comentadas
com `#` são ignoradas — e é assim que o arquivo nasce: com os padrões
comentados, pra você só descomentar o que quer mudar.

    COFFEE_PORT=8090          # porta padrão do `coffee serve`
    COFFEE_LANG=pt            # idioma das mensagens

Precedência: variável de ambiente > arquivo > padrão do código. Assim
`COFFEE_PORT=9000 coffee serve` ganha do arquivo, que ganha do padrão.

Isto NÃO é lido pelo site — é só da CLI.
"""
import os

CONF = os.path.join(os.path.expanduser("~"), ".coffee.conf")

PADROES = {
    "COFFEE_PORT": "8000",
    "COFFEE_LANG": "",          # vazio = detecta pelo $LANG
    "COFFEE_IMG_MAX": "900",    # teto de largura pro `images --otimizar`
    "COFFEE_IMG_Q": "80",       # qualidade JPEG do `images --otimizar`
}


def ler():
    """Devolve a config efetiva (padrões + arquivo), sem o ambiente."""
    valores = dict(PADROES)
    try:
        with open(CONF, encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if not linha or linha.startswith("#") or "=" not in linha:
                    continue
                chave, _, valor = linha.partition("=")
                chave = chave.strip()
                valor = valor.strip().strip('"').strip("'")
                if chave in PADROES:
                    valores[chave] = valor
    except OSError:
        pass          # sem arquivo: só os padrões
    return valores


def get(chave):
    """Valor efetivo de uma chave: ambiente > arquivo > padrão."""
    do_ambiente = os.environ.get(chave)
    if do_ambiente:
        return do_ambiente
    return ler().get(chave) or PADROES.get(chave, "")


def cria_se_faltar():
    """Escreve um ~/.coffee.conf comentado, se ainda não existir.

    Nasce comentado de propósito: o arquivo é pra ser descoberto (você abre,
    vê as opções, descomenta o que quer), não pra mudar comportamento sem
    você saber.
    """
    if os.path.exists(CONF):
        return False
    try:
        with open(CONF, "w", encoding="utf-8") as f:
            f.write(
                "# midnight coffee — configuração da CLI\n"
                "#\n"
                "# Descomente o que quiser mudar. Variáveis de ambiente têm\n"
                "# precedência sobre este arquivo.\n"
                "\n"
                "# porta padrão do `coffee serve`\n"
                "#COFFEE_PORT=8000\n"
                "\n"
                "# idioma das mensagens (pt ou en). Vazio = detecta pelo $LANG.\n"
                "#COFFEE_LANG=\n"
                "\n"
                "# imagens: teto de largura e qualidade JPEG do `images --otimizar`\n"
                "#COFFEE_IMG_MAX=900\n"
                "#COFFEE_IMG_Q=80\n"
            )
        return True
    except OSError:
        return False


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "cria":
        print("criado" if cria_se_faltar() else "já existe")
    elif len(sys.argv) > 2 and sys.argv[1] == "get":
        # precedência completa (ambiente > arquivo > padrão)
        print(get(sys.argv[2]))
    elif len(sys.argv) > 1 and sys.argv[1] == "caminho":
        print(CONF)
    else:
        for k in PADROES:
            print(f"{k}={get(k)}")
