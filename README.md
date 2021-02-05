# Bot de CAPTCHA para grupos de Telegram

Um bot de CAPTCHA para Node.JS usando o framework Telegraf.js

[[imagem]]

### Como funciona?
Usando o framework Telegraf iniciamos um bot capaz de interagir em um grupo
sempre que um novo usuário entrar, mandando uma imagem e uma mensagem.
A imagem é um CAPTCHA e a mensagem é uma instrução para que o código seja respondido em até 3 minutos. 
Caso seja enviado o usuário é validado como "humano" e permanece no grupo.
Caso não seja enviado a mensagem é apagada, o usuário removido do grupo e uma outra mensagem é enviada para os membros avisando que aquele usuário novo não passou no teste e foi removido.
Roda atualmente em uma VPS com Node.JS e consome pouquíssimos recursos. 


### O código:
Projeto baseado no código original de Thiago Medeiros (https://github.com/thiagommedeiros/telegram-bot).


