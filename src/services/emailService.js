import { createTransporter, config } from "../config/nodemailer.js"

/**
 * Valida una dirección de email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Crea el contenido HTML del correo de confirmación de registro
 */
const createRegistrationEmailHtml = (username) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Registro - Boardify</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        
        .content {
          padding: 30px;
        }
        
        .welcome-message {
          background-color: #f8f9ff;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        
        .welcome-message h2 {
          color: #667eea;
          margin-top: 0;
        }
        
        .features {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .features h3 {
          color: #333;
          margin-top: 0;
        }
        
        .features ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .features li {
          margin: 8px 0;
          color: #555;
        }
        
        .footer {
          background-color: #f1f1f1;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        
        @media screen and (max-width: 600px) {
          .email-container {
            margin: 10px;
          }
          
          .header, .content {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🎲 Boardify</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">¡Bienvenido a la comunidad!</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            <h2>¡Hola ${username}! 👋</h2>
            <p>Tu cuenta en Boardify ha sido creada exitosamente. Estamos emocionados de tenerte como parte de nuestra comunidad de amantes de los juegos de mesa.</p>
          </div>
          
          <div class="features">
            <h3>¿Qué puedes hacer ahora?</h3>
            <ul>
              <li>📝 Registrar tus partidas de juegos de mesa</li>
              <li>👥 Gestionar invitados y jugadores</li>
              <li>📊 Ver estadísticas de tus juegos</li>
              <li>🏆 Llevar un seguimiento de tus victorias</li>
              <li>🎯 Descubrir nuevos juegos populares</li>
            </ul>
          </div>
          
          <p>Tu cuenta está lista para usar. Puedes comenzar a registrar tus partidas inmediatamente y aprovechar todas las funcionalidades que Boardify tiene para ofrecerte.</p>
          
          <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Esperamos que disfrutes mucho usando Boardify!</p>
          
          <p style="margin-top: 30px;">
            <strong>¡Que comience la diversión! 🎮</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Boardify. Todos los derechos reservados.</p>
          <p style="font-size: 12px; margin-top: 10px;">
            Este es un correo automático. Por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Envía un correo de confirmación de registro
 */
export const sendRegistrationConfirmation = async (userData) => {
  try {

    if (!userData) {
      throw new Error("userData es requerido")
    }

    const { username, email } = userData
    if (!username || typeof username !== "string" || username.trim().length === 0) {
      throw new Error(`Username inválido: "${username}" (tipo: ${typeof username})`)
    }

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      throw new Error(`Email inválido: "${email}" (tipo: ${typeof email})`)
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim()

    if (!isValidEmail(cleanEmail)) {
      throw new Error(`Formato de email inválido: "${cleanEmail}"`)
    }


    if (!config.EMAIL_USER || !config.EMAIL_PASS) {
      const error = `❌ Faltan credenciales de email:
        EMAIL_USER: ${config.EMAIL_USER || "NO DEFINIDO"}
        EMAIL_PASS: ${config.EMAIL_PASS ? "DEFINIDO" : "NO DEFINIDO"}`
      console.error(error)
      throw new Error(error)
    }

    const transporter = createTransporter()

    try {
      await transporter.verify()
    } catch (verifyError) {
      console.error("❌ Error en verificación SMTP:", verifyError)
      throw new Error(`Error de conexión SMTP: ${verifyError.message}`)
    }

    const mailOptions = {
      from: `"Boardify 🎲" <${config.EMAIL_USER}>`,
      to: cleanEmail,
      subject: `¡Bienvenido/a ${cleanUsername}! Tu cuenta en Boardify está lista 🎮`,
      html: createRegistrationEmailHtml(cleanUsername),
      text: `¡Hola ${cleanUsername}!\n\n¡Bienvenido/a a Boardify! 🎲\n\nTu cuenta ha sido creada exitosamente y ya puedes comenzar a registrar tus partidas de juegos de mesa.\n\n¿Qué puedes hacer ahora?\n- Registrar tus partidas\n- Gestionar invitados\n- Ver estadísticas\n- Llevar seguimiento de victorias\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\n¡Que comience la diversión!\n\nEl equipo de Boardify`,
    }

    if (!mailOptions.to || mailOptions.to.trim().length === 0) {
      throw new Error(`Destinatario no definido en mailOptions.to: "${mailOptions.to}"`)
    }

    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      message: "Correo de confirmación enviado exitosamente.",
      messageId: info.messageId,
      response: info.response,
      details: {
        accepted: info.accepted,
        rejected: info.rejected,
        pending: info.pending,
      },
    }
  } catch (error) {
    console.error("❌ Error al enviar el email de confirmación:")
    console.error("🔍 Detalles del error:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })

    return {
      success: false,
      error: `Error al enviar el correo de confirmación: ${error.message}`,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
      },
    }
  }
}

/**
 * Función de prueba para verificar la configuración de email
 */
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter()

    const isConnected = await transporter.verify()

    return {
      success: true,
      message: "Configuración de email verificada correctamente",
      config: {
        user: config.EMAIL_USER,
        hasPassword: !!config.EMAIL_PASS,
      },
    }
  } catch (error) {
    console.error("❌ Error en la configuración de email:", error)

    return {
      success: false,
      error: error.message,
      config: {
        user: config.EMAIL_USER,
        hasPassword: !!config.EMAIL_PASS,
      },
    }
  }
}

export default { sendRegistrationConfirmation, testEmailConfiguration }
