# 🎲 Flowgame - Backend

El backend de **Flowgame** es una API RESTful construida con **Node.js**, **Express** y **MongoDB**, diseñada para manejar la lógica de negocio y persistencia de datos de una aplicación para registrar partidas de juegos de mesa con amigos. Integra WebSockets, subida de archivos, envío de correos y control de autenticación con JWT y cifrado de contraseñas.

🔗 **[Ver frontend](https://github.com/SandraCarretero/turno-frontend)**

---

## ✨ Funcionalidades principales

👥 **Gestión de usuarios**
- Registro y login con autenticación por JWT
- Cifrado de contraseñas con bcrypt
- Edición de perfil y cambio de avatar (con Multer)
- Eliminación de cuenta

🧑‍🤝‍🧑 **Amistades**
- Enviar y recibir solicitudes de amistad
- Aceptar o rechazar amigos
- Lista de amigos
- Generación de notificaciones al enviar o aceptar

📩 **Notificaciones**
- Sistema de notificaciones en tiempo real mediante WebSocket
- Notificaciones cuando:
  - Un usuario te envía una solicitud de amistad
  - Aceptan tu solicitud
  - Te añaden en una partida

🎮 **Partidas**
- Crear, editar, eliminar y consultar partidas
- Añadir jugadores, puntuaciones y duración
- Asignación de juegos de mesa a cada partida

🎲 **Juegos de mesa**
- Guardar juegos propios
- Buscar información usando la API externa de [BoardGameGeek](https://boardgamegeek.com/xmlapi2)

📧 **Email (Nodemailer)**
- Envío de correos al registrarse

---

## 🧠 ¿Qué he aprendido en el backend?

- Creación de una API RESTful modular
- Uso de middlewares para proteger rutas privadas y administrativas
- Validación y sanitización de datos de entrada
- Implementación de WebSockets para notificaciones en tiempo real
- Subida de archivos de usuario con Multer
- Integración con servicios externos (BoardGameGeek, Nodemailer)
- Aplicación de los principios **SOLID** para escalar el código fácilmente

---

## 🛠️ Tecnologías utilizadas

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)
[![WebSocket](https://img.shields.io/badge/WebSocket-35495E?style=for-the-badge&logo=websockets&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
![Multer](https://img.shields.io/badge/Multer-00BFFF?style=for-the-badge)
![Nodemailer](https://img.shields.io/badge/Nodemailer-3466A6?style=for-the-badge)
![Bcrypt](https://img.shields.io/badge/Bcrypt-ffcc00?style=for-the-badge)

---

## Autor ✒️

**SANDRA CARRETERO**

- [sandracarretero24@gmail.com](sandracarretero24@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/sandra-carretero-lopez/)
<!-- - [Porfolio web](https://tu-dominio.com/) -->

## Licencia 📄

MIT Public License v3.0
No puede usarse comercialmente.

