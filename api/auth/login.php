<?php
    
    require_once '../config/headers.php';
    require_once '../config/db.php';

    session_start();

    $datos_recibidos = json_decode(file_get_contents('php://input'),true);

    $email = trim($datos_recibidos['email']);
    $password = trim($datos_recibidos['password']);

    try {
        
        $sql = "SELECT id_usuario, password_hash, rol FROM usuarios WHERE email = ?";
        $consulta = $conexion->prepare($sql);
        $consulta->execute([$email]);
        
        if ($consulta->rowCount() === 1) {
            $usuario = $consulta->fetch();
            
            if (password_verify($password, $usuario['password_hash'])) {
                
                $_SESSION['id_usuario'] = $usuario['id_usuario'];
                $_SESSION['email']      = $email;
                $_SESSION['rol']        = $usuario['rol'];
                
                echo json_encode([
                    'status' => true, 
                    'message' => 'Bienvenido al sistema',
                    'rol' => $usuario['rol']
                ]);
                
            } else {
                http_response_code(401);
                echo json_encode(['status' => false, 'message' => 'Contraseña incorrecta']);
            }
            
        } else {
            http_response_code(404);
            echo json_encode(['status' => false, 'message' => 'Usuario no encontrado']);
        }

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error del sistema: ' . $error->getMessage()]);
    }
