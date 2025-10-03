// Este arquivo vai na pasta: api/chat.js

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { message, history } = req.body;

    // Validação básica
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem inválida' });
    }

    // Proteção contra mensagens muito longas
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Mensagem muito longa' });
    }

    // Monta o contexto da conversa
    const conversationContext = history
      .map(m => `${m.role === 'user' ? 'Pessoa' : 'Mentor'}: ${m.content}`)
      .join('\n');

    const prompt = `Você é um Mentor de Oportunidades do Brasil. Seu objetivo é ajudar pessoas a descobrirem caminhos educacionais e profissionais através de seus interesses e hobbies.

IMPORTANTE:
- Faça perguntas empáticas e encorajadoras
- Identifique habilidades por trás dos hobbies mencionados
- Faça conexões criativas e não-óbvias entre interesses e carreiras
- Sugira 2-3 oportunidades educacionais REAIS no Brasil (cursos gratuitos, bolsas, programas)
- Inclua links quando possível (Coursera, SENAI, SENAC, Sebrae, universidades públicas, etc)
- Use emojis para deixar a conversa mais leve
- Seja motivador e mostre que TODO interesse pode virar algo profissional

Contexto da conversa até agora:
${conversationContext}

Pessoa: ${message}

Responda como o Mentor de Oportunidades:`;

    // Chama a API do Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return res.status(200).json({
        response: data.candidates[0].content.parts[0].text
      });
    } else {
      throw new Error('Resposta inválida da API do Google');
    }

  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({
      error: 'Erro ao processar sua mensagem'
    });
  }
}
