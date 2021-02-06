require('dotenv').config()
//Importamos além do express o Telegraf.js que é o framework que utilizaremos para
//criação desse bot.
const express = require('express')
const Telegraf = require('telegraf')
const captcha = require('./captcha.js')

//nosso servidor vai escutar a porta 3002. 
const app = express()
app.set('port', (process.env.PORT || 3002))
app.listen(app.get('port'), () =>
console.log('Aplicativo rodando e servidor escutando a porta ', app.get('port')))


// início do bot
const bot = new Telegraf(process.env.TOKEN)

//criação do CaptchaApp responsável pelas funcionalidades do bot - um objeto com 
//vários ítens.
const CaptchaApp = {
  //aqui o captcha que o usuário vai digitar. Ele é inicializado como
  //um array vazio.
  usersInCaptcha: [],
  

  //A função init chama os binds e também o launch do bot.
  init() {
    this.bindEvents()
    bot.launch()
  },

  //binde events faz os bindings(!) necessários para o funcionamento.
  bindEvents() {
    bot.command('startAutoMsgs', this.startAutoMessages)
    bot.command('stopAutoMsgs', this.stopAutoMessages)
    bot.on('new_chat_members', this.Events.onMemberEnter.bind(this))
    bot.on('message', this.Events.onNewMessage.bind(this))
  },

  //aqui uma função para o disparo de mensagens automáticas inicia com intervalos de 1, 3 e 5 dias.
  //Este bot foi originalmente feito para um grupo que tem Portugal como tema.
  startAutoMessages(ctx) {

    ctx.reply('Nunca deixe de sonhar 🇵🇹')

    // this.mmp = setInterval(() => {
    //   ctx.reply(`Vcs conhecem o Método Morar em Portugal? 🇵🇹\n\nLá tem todas informações que você precisa para imigrar com segurança!\n\nClique neste link para saber mais: http://bit.ly/388mjha`)
    // }, 86400000) // primeiro dia

    // this.m1 = setInterval(() => {
    //   ctx.reply(`Você tem que acordar todos os dias e dizer para si mesmo(a):\n\n"Eu posso, eu consigo, eu vou morar em Portugal! 🇵🇹\n\nContinue acreditando!`)
    // }, 259200000) // terceiro dia

    // this.m2 = setInterval(() => {
    //   ctx.reply(`O poder está dentro de você, na sua mente, pois se acreditar que consegue não haverá obstáculo capaz de impedir o seu sucesso! Força! 🇵🇹`)
    // }, 432000000) // quinto dia
  },

  //e aqui uma função para parar as eventuais mensagens automáticas.
  stopAutoMessages(ctx) {
   ctx.reply('Portugal é um país maravilhoso, vcs não acham?! 🇵🇹')

    clearInterval(this.mmp)
    clearInterval(this.m1)
    clearInterval(this.m2)
  },

  //aqui escolhemos randômicamente um dos captchas que criamos.
  getRandomCaptcha() {
    //essa const escolhe um número aleatório levando em conta a quantidade de captchas que
    //criamos no arquivo captcha.js
    const randomNumber = Math.floor(Math.random() * captcha.length) + 0
    //aqui essa função retorna o índice 'x' do captcha. 
    return captcha[randomNumber]
  },

  //o 2º item do nosso objeto App é esse Events (o 1º é usersInCaptcha):
  Events: {
    //de forma assíncrona, ao receber uma nova mensagem são criadas duas consts
    //baseadas no contexto.
    async onNewMessage(ctx) {
      const { message } = ctx
      const { from, text } = message
      //deixei esse console.log aqui para você poder ver que campos estão disponíveis nesse contexto.
      console.log(message)
      //a cada msg recebida eu logo primeiro e último nomes, username, id, se é bot e o texto da mensagem.
      console.log(`Nova mensagem de ${message.from.first_name} ${message.from.last_name} (username: ${message.from.username} id: ${message.from.id}, É bot: ${message.from.is_bot}): ${text}`)

      //Aqui verificamos se esse usuário está no nosso array de usersInCaptcha
      //essa const user vai buscar no array de usersInCaptcha algum valor de user.id que seja
      //idêntico ao from.id. Se enconatrar este será seu valor. Se não encontrar será null.
      const user = this.usersInCaptcha.find(user => user.id === from.id) || null
      
      //se ele encontrar lá no usersInCaptcha o user ele vai bater o texto enviado com o 
      //captcha.code que ele deve digitar (se não for um robô)
      if (user) {
        if (text == user.captcha.code) {
          //se o texto for igual ao captcha ele chama a função de remover o usuário da lista de captcha
          this.removeUserFromCaptchaList(user.id)
          //e manda uma resposta positiva para o grupo.
          await ctx.reply(`👍 Ok, ${user.userString} não é um robô.`)
          //e outra pedindo para o novo membro ler as regras do grupo.
          await ctx.reply(`${user.userString}, não esqueça de ler as regras na mensagem fixada no topo do grupo.`)
          //e aqui outra função é chamada para deletar algumas mensagens, como as do captcha que deveria ser digitado.
          this.deleteMessages(ctx, user.messagesToDelete)
        } else {
          //o usuário tem tentativas para digitar o código correto. Se o if acima não for atendido
          //ou seja, se o texto enviado não for igual ao captcha uma das tentativas é subtraída
          user.attempt -= 1
          //e se o número de tentativas for menor ou igual a zero é pq o código não foi inserido corretamente
          //e o usuário deve ser um robô.
          if (user.attempt <= 0) {
            //Assim a função de expulsar o usuário é acionada enviando os dados como contexto, id e mensagem 
            //negativa para o grupo.
            this.kickUserInCaptcha({
              ctx,
              id: user.id,
              message: `🚨 ${user.userString} não digitou o código corretamente e foi removido(a).`
            })
            //ainda há uma verificação se há mensagens e id de mensagens para mandar isso ao messagesTo Delete.
            if (message && message.message_id) {
              user.messagesToDelete.push(message.message_id)
            }
            //por fim, nessa condição de tentativa menor ou igual a zero, a função de deletar mensagens
            //é chamada.
            this.deleteMessages(ctx, user.messagesToDelete)
            //ou então, se o número de tentativas restantes não for menor ou igual a zero
          } else {
            //o novo usuário é alertado que o código não está correto e que ele ainda tem 'x' tentativas.
            const msg_invalid = await ctx.reply(`${user.userString}, código inválido, você tem mais ${user.attempt} tentativas. Maiúsculas e minúsculas fazem diferença.`)
            //toda essa comunicação vai sendo enviada para o messagesToDelete...
            user.messagesToDelete.push(msg_invalid.message_id)
            user.messagesToDelete.push(message.message_id)
          }

          //ainda caso o texto digitado não bata com o captcha é preciso que o número de tentativas 
          //do ususário seja atualizado e para isso famos usar o método map.
          //Lembrando que o map devolve um novo array como resultado, então aqui pra atualizar as tentativas
          //do usuário usamos um map em usersInCaptcha com um operador ternário que vai avaliar a condição de 
          //usr.id, se igual a user.id. Se for true retorna um array com o conteúdo de usr, as tentativas e 
          //as mensagens para deletar. Caso seja false retorna usr.
          this.usersInCaptcha = this.usersInCaptcha.map(usr => {
            return usr.id === user.id ? { ...usr, attempt: user.attempt, messagesToDelete: user.messagesToDelete } : usr })
        }
      }
    //aqui termina o evento de mensagem recebida. Agora vamos para um novo usuário no grupo.
    },
    
    //ainda dentro de Events precisamos que o bot atue não só ao receber mensagens mas também ao perceber
    //a entrada de um novo membro no grupo. 
    async onMemberEnter(ctx) {
      //aqui buscamos alguns itens do contexto, como no caso de mensagem recebida. 
      const { message } = ctx
      const { new_chat_participant } = message
      const { id, first_name, last_name, username } = new_chat_participant
      
      //IMPORTANTE!!! é preciso verificar se o username que entrou não é o username do nosso bot.
      //aqui deve ser inserido o username do seu bot. Caso a função perceba que é o mesmo usuário
      //ela para a execução.
      if (username === 'porteirotugabot') return

      //também criamos uma user String para o primeiro nome do usuario.
      let userString = `${first_name}`
      //e verificamos se há sobrenome informado. Se houver adicionamos como last_name.
      if (last_name) userString += ` ${last_name}`
      //e se houver username adicionamos também.
      if (username) userString += ` (@${username})`

      //também criamos uma const para o captcha que será o resultado da nossa função getRandomCaptcha ou
      //caso aconteça algo será o 1º captcha do nosso array.
      const captcha = this.getRandomCaptcha() || captcha[0]
      //criamos também uma mensagem de boas vindas que será uma imagem com um texto. 
      //A imagem é o captcha e o texto são as instruções.
      const msg_welcome = await ctx.replyWithPhoto({ source: `./images/${captcha.image}` }, { caption: `Olá ${userString}!\n\nSeja bem-vindo(a) ao grupo!\n\nATENÇÃO: Para garantir que você não é um robô, envie uma mensagem com as letras e números que aparecem na imagem acima dentro de 3 minutos.\nLetras maiúsculas e minúsculas fazem diferença. Você tem três chances. \nSe a mensagem não for enviada você será removido(a) do grupo automaticamente.` })
      //e por fim nosso array de mensagens para serem deletadas.
      const messagesToDelete = [msg_welcome.message_id, captcha.image]

      // Essa função vai, então, adicionar o usuário ao array que criamos no início, o usersInCaptcha, 
      //mandando todas as informações relacionadas a ele.
      this.usersInCaptcha.push({
        id,
        userString,
        captcha,
        attempt: 3,
        messagesToDelete,
      })

      //e um timeout para deleteMessages e kickUserInCaptcha é definido aqui:
      setTimeout(() => {
        this.deleteMessages(ctx, messagesToDelete)
        this.kickUserInCaptcha({
          ctx,
          id,
          message: `🚨 ${userString} não digitou o código e foi removido(a).`
        })
      //no valor de 180 segundos ou 3 minutos.
      }, 180000)

    }
  },

  //sendo necessário expulsar o usuário essa função é chamada.
  kickUserInCaptcha({ ctx, id, message }) {
    //é criada uma constante para o user nesse escopo e um find é feito em 
    //usersInCaptcha para localizar o id que foi informado como argumento id nessa função.
    const user = this.usersInCaptcha.find(user => user.id === id)
    //se esse user for encontrado - se ele existir - ele é removido e expulso.
    if (user) {
      this.removeUserFromCaptchaList(user.id)
      ctx.kickChatMember(id)
      //além de responder ao grupo com a mensagem padrão.
      ctx.reply(message)
    }
  },
  //aqui a função para deletar as mensagens trocadas na tentativa.
  deleteMessages(ctx, messagesId) {
    messagesId.forEach(id => {
      if (id) ctx.deleteMessage(id).catch(console.log)
    })
  },

  //e a função responsável por retirar o usuário do captchaList.
  removeUserFromCaptchaList(id) {
    this.usersInCaptcha = this.usersInCaptcha.filter(user => user.id !== id)
  },

}


CaptchaApp.init()

