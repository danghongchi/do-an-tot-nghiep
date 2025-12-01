// Lightweight bridge to emit realtime events without circular imports
// The actual SocketService instance is injected by server.js

let socketService = null;

function setSocketService(instance) {
  socketService = instance;
}

function emitAppointmentUpdate(appointmentId, update) {
  if (!socketService) return;
  try {
    socketService.sendAppointmentUpdate(appointmentId, update);
  } catch (_) {}
}

function emitToUser(userId, event, payload) {
  if (!socketService) return;
  try {
    socketService.io.to(`user_${userId}`).emit(event, payload);
  } catch (_) {}
}

module.exports = {
  setSocketService,
  emitAppointmentUpdate,
  emitToUser,
};



