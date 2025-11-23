<?php
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    
    if (!isset($_SESSION['id_usuario']) || $_SESSION['rol'] !== 'paciente') {
        http_response_code(403);
        echo json_encode(['status' => false, 'message' => 'Acceso denegado: Solo para pacientes.']);
        exit;
    }
