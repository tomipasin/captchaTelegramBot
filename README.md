# Bot de CAPTCHA para grupos de Telegram

Um bot de CAPTCHA para Node.JS usando o framework Telegraf.js

<img src="https://tomipasin.com/captcha/Exemplo1.png" style="width: 680px"/>
</hr>
<img src="https://tomipasin.com/captcha/Exemplo2.png" style="width: 680px"/>

### Como usar?
Adicione <strong>@porteirotugabot</strong> ao seu grupo e dê a ele permissões de administrador.

### Como funciona?
Usando o framework Telegraf iniciamos um bot capaz de interagir em um grupo
sempre que um novo usuário entrar, mandando uma imagem e uma mensagem.
A imagem é um CAPTCHA e a mensagem é uma instrução para que o código seja respondido em até 3 minutos. 
Caso seja enviado o usuário é validado como "humano" e permanece no grupo.
Caso não seja enviado a mensagem é apagada, o usuário removido do grupo e uma outra mensagem é enviada para os membros avisando que aquele usuário novo não passou no teste e foi removido.
Roda atualmente em uma VPS com Node.JS e consome pouquíssimos recursos. 


### O código:
Projeto baseado no código original de Thiago Medeiros (https://github.com/thiagommedeiros/telegram-bot).

### Como testar?
Clone este repositório e use o comando:
```sh
npm install
```
Vá no Telegram e busque pelo @BotFather para criar o seu bot e obter o seu token.
Mais detalhes sobre o processo de criação do bot você encontra nesse link: <a>https://core.telegram.org/bots#3-how-do-i-create-a-bot</a>

Crie um arquivo .env com o seu token. Eu deixei um ".env_TEMPLATE" neste código. 
É só colocar o seu token e renomear para somente ".env".
Exemplo:

```sh
TOKEN=[aqui coloque o token do seu bot criado com o BotFather no Telegram]
```


Este comando instalará as dependências que constam em package.json.
Logo em seguida use:

```sh
npm start
```

Este bot está programado para permitir somente novos membros que não sejam bots, excluíndo os que forem bot imediatamente. Assim o captcha será exibido somente para usuários que tenham no seu contexto "is_bot: false".

```sh
 if(message.new_chat_member.is_bot){
        console.log('É bot. Vou remover...')
        ctx.kickChatMember(message.new_chat_member.id)
        return
      }
```



Este bot está rodando tranquilamente em um servidor VPS Intel(R) Xeon(R) CPU E5-2630 v4 @ 2.20GHz x1 com 450MiB de memória e sistema Ubuntu server 18.04 LTS. Seu consumo médio de memória é 45MiB.


Qualquer dúvida me chame por aqui ou pelo Telegram em @tomipasin. 





