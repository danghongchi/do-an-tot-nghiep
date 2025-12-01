-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 13, 2025 lúc 01:49 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `webdb`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_chat_history`
--

CREATE TABLE `ai_chat_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `response` longtext DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `counselor_id` int(11) NOT NULL,
  `schedule_id` int(11) NOT NULL,
  `appointment_type` enum('online','offline') NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `notes` text DEFAULT NULL,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `status` enum('payment_pending','pending','confirmed','in_progress','completed','cancelled') DEFAULT 'payment_pending',
  `meeting_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `counselor_id`, `schedule_id`, `appointment_type`, `appointment_date`, `appointment_time`, `notes`, `is_anonymous`, `status`, `meeting_url`, `created_at`, `updated_at`) VALUES
(40, 20, 5, 84, 'online', '2025-10-14', '14:00:00', '', 0, 'confirmed', NULL, '2025-10-13 11:47:31', '2025-10-13 11:49:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `counselor_applications`
--

CREATE TABLE `counselor_applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `specialty_id` int(11) NOT NULL,
  `experience_years` int(11) NOT NULL,
  `experience_description` text NOT NULL,
  `clinic_address` text DEFAULT NULL,
  `online_price` decimal(10,2) DEFAULT NULL,
  `offline_price` decimal(10,2) DEFAULT NULL,
  `working_hours` text DEFAULT NULL,
  `qualification_documents` text DEFAULT NULL,
  `identity_documents` text DEFAULT NULL,
  `license_documents` text DEFAULT NULL,
  `payment_info` text DEFAULT NULL,
  `status` enum('pending_review','approved','rejected') DEFAULT 'pending_review',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `counselor_applications`
--

INSERT INTO `counselor_applications` (`id`, `user_id`, `specialty_id`, `experience_years`, `experience_description`, `clinic_address`, `online_price`, `offline_price`, `working_hours`, `qualification_documents`, `identity_documents`, `license_documents`, `payment_info`, `status`, `created_at`, `updated_at`) VALUES
(1, 22, 7, 6, 'đỉnh', ' số 25 đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7.', 600000.00, 550000.00, 'Thứ 2-6', '[\"qualification_documents-1757837058488-519567134.png\"]', '[\"identity_documents-1757837058491-470675788.png\"]', '[\"license_documents-1757837058492-200476623.png\"]', '2059109019, DANG HONG CHI, MB Bank', 'approved', '2025-09-14 08:04:18', '2025-09-14 08:14:59');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `counselor_profiles`
--

CREATE TABLE `counselor_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `specialty_id` int(11) NOT NULL,
  `clinic_address` text DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL,
  `experience_description` text DEFAULT NULL,
  `online_price` decimal(10,2) DEFAULT NULL,
  `offline_price` decimal(10,2) DEFAULT NULL,
  `working_hours` text DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `rating` float DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `counselor_profiles`
--

INSERT INTO `counselor_profiles` (`id`, `user_id`, `specialty_id`, `clinic_address`, `avatar_url`, `experience_years`, `experience_description`, `online_price`, `offline_price`, `working_hours`, `is_available`, `rating`, `created_at`, `updated_at`) VALUES
(5, 22, 7, 'số 25 đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7', '/uploads/avatar-1757945221347-791938407.jpg', 6, 'đỉnh', 600000.00, 550000.00, 'Thứ 2-6', 1, 0, '2025-09-14 08:14:59', '2025-10-01 07:46:24');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `counselor_schedules`
--

CREATE TABLE `counselor_schedules` (
  `id` int(11) NOT NULL,
  `counselor_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `appointment_type` enum('online','offline') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `counselor_schedules`
--

INSERT INTO `counselor_schedules` (`id`, `counselor_id`, `date`, `start_time`, `end_time`, `is_available`, `appointment_type`, `created_at`, `updated_at`) VALUES
(80, 5, '2025-10-14', '08:00:00', '09:00:00', 1, 'online', '2025-10-13 10:42:45', '2025-10-13 10:42:45'),
(81, 5, '2025-10-14', '09:00:00', '10:00:00', 1, 'online', '2025-10-13 10:42:45', '2025-10-13 10:42:45'),
(82, 5, '2025-10-14', '10:00:00', '11:00:00', 1, 'online', '2025-10-13 10:42:45', '2025-10-13 10:42:45'),
(83, 5, '2025-10-14', '11:00:00', '12:00:00', 1, 'online', '2025-10-13 10:42:45', '2025-10-13 10:42:45'),
(84, 5, '2025-10-14', '14:00:00', '15:00:00', 1, 'online', '2025-10-13 10:42:45', '2025-10-13 10:42:45'),
(85, 5, '2025-10-14', '15:00:00', '16:00:00', 1, 'online', '2025-10-13 10:42:45', '2025-10-13 10:42:45'),
(86, 5, '2025-10-14', '16:00:00', '17:00:00', 1, 'online', '2025-10-13 10:42:45', '2025-10-13 10:42:45'),
(87, 5, '2025-10-14', '17:00:00', '18:00:00', 1, 'online', '2025-10-13 10:42:45', '2025-10-13 10:42:45'),
(88, 5, '2025-10-15', '08:00:00', '09:00:00', 1, 'online', '2025-10-13 10:42:50', '2025-10-13 10:42:50'),
(89, 5, '2025-10-15', '09:00:00', '10:00:00', 1, 'online', '2025-10-13 10:42:50', '2025-10-13 10:42:50'),
(90, 5, '2025-10-15', '10:00:00', '11:00:00', 1, 'online', '2025-10-13 10:42:50', '2025-10-13 10:42:50'),
(91, 5, '2025-10-15', '11:00:00', '12:00:00', 1, 'online', '2025-10-13 10:42:50', '2025-10-13 10:42:50'),
(92, 5, '2025-10-15', '14:00:00', '15:00:00', 1, 'online', '2025-10-13 10:42:50', '2025-10-13 10:42:50'),
(93, 5, '2025-10-15', '15:00:00', '16:00:00', 1, 'online', '2025-10-13 10:42:50', '2025-10-13 10:42:50'),
(94, 5, '2025-10-15', '16:00:00', '17:00:00', 1, 'online', '2025-10-13 10:42:50', '2025-10-13 10:42:50'),
(95, 5, '2025-10-15', '17:00:00', '18:00:00', 1, 'online', '2025-10-13 10:42:50', '2025-10-13 10:42:50');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `email_verification_tokens`
--

CREATE TABLE `email_verification_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message_type` enum('text','image','file') DEFAULT 'text',
  `content` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `type` enum('info','success','warning','error','appointment','chat','system','counselor_application','admin','payment') NOT NULL DEFAULT 'info',
  `priority` enum('low','medium','high','urgent','normal') NOT NULL DEFAULT 'medium',
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `priority`, `data`, `is_read`, `read_at`, `created_at`, `updated_at`) VALUES
(69, 22, 'Lịch hẹn mới', 'Bạn có một yêu cầu đặt lịch mới', 'appointment', 'high', '{\"appointment_id\":29,\"date\":\"2025-10-14\",\"time\":\"19:31\"}', 1, '2025-10-13 17:33:20', '2025-10-13 10:31:55', '2025-10-13 10:33:20'),
(85, 20, 'Vui lòng thanh toán', 'Lịch hẹn đã được tạo, vui lòng hoàn tất thanh toán để xác nhận', 'payment', 'high', '{\"appointment_id\":38,\"date\":\"2025-10-15\",\"time\":\"08:00\"}', 1, '2025-10-13 18:40:20', '2025-10-13 11:39:07', '2025-10-13 11:40:20'),
(86, 20, 'Vui lòng thanh toán', 'Lịch hẹn đã được tạo, vui lòng hoàn tất thanh toán để xác nhận', 'payment', 'high', '{\"appointment_id\":39,\"date\":\"2025-10-15\",\"time\":\"09:00\"}', 1, '2025-10-13 18:41:45', '2025-10-13 11:40:45', '2025-10-13 11:41:45'),
(87, 20, 'Vui lòng thanh toán', 'Lịch hẹn đã được tạo, vui lòng hoàn tất thanh toán để xác nhận', 'payment', 'high', '{\"appointment_id\":40,\"date\":\"2025-10-14\",\"time\":\"14:00\"}', 1, '2025-10-13 18:49:12', '2025-10-13 11:47:31', '2025-10-13 11:49:12');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `token`, `expires_at`, `used`, `created_at`) VALUES
(1, 20, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImNoaWhvbmc4MTk4QGdtYWlsLmNvbSIsImlhdCI6MTc1Nzk1MDU5OCwiZXhwIjoxNzU3OTU0MTk4fQ.eBZZ08AtZK8Pnk5EjZCh-RV25Nx5XXFYj1UjfBsUOPc', '2025-09-15 15:37:11', 1, '2025-09-15 15:36:38');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `gateway` varchar(50) DEFAULT 'vnpay',
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `txn_ref` varchar(100) DEFAULT NULL,
  `raw_data` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `payments`
--

INSERT INTO `payments` (`id`, `appointment_id`, `amount`, `gateway`, `status`, `txn_ref`, `raw_data`, `created_at`) VALUES
(24, 39, 600000.00, 'vnpay', 'pending', '391760355645158', NULL, '2025-10-13 11:40:45'),
(25, 40, 600000.00, 'vnpay', 'pending', '401760356051933', NULL, '2025-10-13 11:47:31');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `counselor_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `specialties`
--

CREATE TABLE `specialties` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `specialties`
--

INSERT INTO `specialties` (`id`, `name`, `description`, `is_active`, `created_at`) VALUES
(1, 'Tâm lý học lâm sàng', 'Chuyên về trị liệu tâm lý', 1, '2025-09-10 04:07:55'),
(2, 'Tâm lý học giáo dục', 'Hỗ trợ học đường và học tập', 1, '2025-09-10 04:07:55'),
(3, 'Tâm lý hôn nhân gia đình', 'Hỗ trợ các vấn đề trong hôn nhân', 1, '2025-09-10 04:07:55'),
(4, 'Tâm lý hướng nghiệp', 'Hỗ trợ định hướng nghề nghiệp và phát triển sự nghiệp', 1, '2025-09-10 05:35:47'),
(5, 'Tâm lý phục hồi xã hội', 'Hỗ trợ phục hồi và tái hòa nhập xã hội', 1, '2025-09-10 05:35:47'),
(7, 'Tâm lý học phát triển', 'Chuyên về tâm lý trẻ em và thanh thiếu niên', 1, '2025-09-10 05:18:34'),
(8, 'Tâm lý học tổ chức', 'Chuyên về tâm lý học công việc và tổ chức', 1, '2025-09-10 05:18:34'),
(10, 'Tâm lý trẻ em và vị thành niên', NULL, 1, '2025-09-18 06:11:35'),
(11, 'Tâm lý tình yêu – quan hệ', NULL, 1, '2025-09-18 06:11:54'),
(12, 'Tâm lý sức khỏe', NULL, 1, '2025-09-18 06:12:17'),
(13, 'Tâm lý giới tính & xu hướng tính dục', NULL, 1, '2025-09-18 06:13:01'),
(15, 'Tâm lý người cao tuổi', NULL, 1, '2025-09-18 06:13:13');

-- --------------------------------------------------------

--
-- Cấu trúc đóng vai cho view `token_stats`
-- (See below for the actual view)
--
CREATE TABLE `token_stats` (
`token_type` varchar(18)
,`total_tokens` bigint(21)
,`active_tokens` bigint(21)
,`expired_tokens` bigint(21)
);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `provider` enum('local','google') NOT NULL DEFAULT 'local',
  `provider_id` varchar(191) DEFAULT NULL,
  `role` enum('user','counselor','admin') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `email_verified` tinyint(1) DEFAULT 0,
  `accept_anonymous_chat` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `email_verified_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `avatar_url`, `phone`, `password`, `gender`, `date_of_birth`, `provider`, `provider_id`, `role`, `is_active`, `email_verified`, `accept_anonymous_chat`, `created_at`, `updated_at`, `email_verified_at`) VALUES
(2, 'cho', 'chidang8198@gmail.com', NULL, '0333695529', '$2b$10$h1rC/KyIQf9zbijPFbBhaOKjEHj.MqM6fVJ2UdDIiHXerIUnu6lIy', 'male', NULL, 'local', NULL, 'admin', 1, 1, 0, '2025-09-09 14:53:03', '2025-09-14 07:22:05', NULL),
(20, 'Đặng Hồng Chí', 'chihong8198@gmail.com', NULL, '0333695529', '$2b$10$GOpT8UNGfaOdWpQ1VRoqdeLgbpdidcekR5jj3rWzry4Fu.Emq8m62', 'male', '2004-06-14', 'local', NULL, 'user', 1, 1, 0, '2025-09-14 07:26:51', '2025-09-15 15:37:11', NULL),
(22, 'TS.Dang Hong Chi', 'danghongchi8198@gmail.com', NULL, '0333695524', '$2b$10$aB.QlYESoBF6.QAtZkvHguonnLOqjZbryiL0VfFPn6pqAzW4XVkGC', 'female', '2004-11-14', 'local', NULL, 'counselor', 1, 1, 0, '2025-09-14 07:52:18', '2025-09-15 17:29:04', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc cho view `token_stats`
--
DROP TABLE IF EXISTS `token_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `token_stats`  AS SELECT 'email_verification' AS `token_type`, count(0) AS `total_tokens`, count(case when `email_verification_tokens`.`expires_at` > current_timestamp() then 1 end) AS `active_tokens`, count(case when `email_verification_tokens`.`expires_at` <= current_timestamp() then 1 end) AS `expired_tokens` FROM `email_verification_tokens`union all select 'password_reset' AS `token_type`,count(0) AS `total_tokens`,count(case when `password_reset_tokens`.`expires_at` > current_timestamp() and `password_reset_tokens`.`used` = 0 then 1 end) AS `active_tokens`,count(case when `password_reset_tokens`.`expires_at` <= current_timestamp() or `password_reset_tokens`.`used` = 1 then 1 end) AS `expired_tokens` from `password_reset_tokens`  ;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ai_history_user_created` (`user_id`,`created_at`);

--
-- Chỉ mục cho bảng `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `counselor_id` (`counselor_id`),
  ADD KEY `schedule_id` (`schedule_id`);

--
-- Chỉ mục cho bảng `counselor_applications`
--
ALTER TABLE `counselor_applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_specialty` (`specialty_id`);

--
-- Chỉ mục cho bảng `counselor_profiles`
--
ALTER TABLE `counselor_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_counselor_profiles_user` (`user_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `specialty_id` (`specialty_id`);

--
-- Chỉ mục cho bảng `counselor_schedules`
--
ALTER TABLE `counselor_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_schedule_slot` (`counselor_id`,`date`,`start_time`,`end_time`),
  ADD KEY `counselor_id` (`counselor_id`);

--
-- Chỉ mục cho bảng `email_verification_tokens`
--
ALTER TABLE `email_verification_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `idx_messages_appointment_created` (`appointment_id`,`created_at`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_priority` (`priority`);

--
-- Chỉ mục cho bảng `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `expires_at` (`expires_at`),
  ADD KEY `idx_password_reset_tokens_user_expires` (`user_id`,`expires_at`),
  ADD KEY `idx_password_reset_tokens_token_used` (`token`,`used`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_txn_ref` (`txn_ref`),
  ADD KEY `idx_payments_appointment` (`appointment_id`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `counselor_id` (`counselor_id`);

--
-- Chỉ mục cho bảng `specialties`
--
ALTER TABLE `specialties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uniq_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_email_verified` (`email_verified`),
  ADD KEY `idx_users_provider_id` (`provider`,`provider_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT cho bảng `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT cho bảng `counselor_applications`
--
ALTER TABLE `counselor_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `counselor_profiles`
--
ALTER TABLE `counselor_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `counselor_schedules`
--
ALTER TABLE `counselor_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT cho bảng `email_verification_tokens`
--
ALTER TABLE `email_verification_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT cho bảng `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT cho bảng `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `specialties`
--
ALTER TABLE `specialties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`counselor_id`) REFERENCES `counselor_profiles` (`id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`schedule_id`) REFERENCES `counselor_schedules` (`id`);

--
-- Các ràng buộc cho bảng `counselor_profiles`
--
ALTER TABLE `counselor_profiles`
  ADD CONSTRAINT `counselor_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `counselor_profiles_ibfk_2` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`);

--
-- Các ràng buộc cho bảng `counselor_schedules`
--
ALTER TABLE `counselor_schedules`
  ADD CONSTRAINT `counselor_schedules_ibfk_1` FOREIGN KEY (`counselor_id`) REFERENCES `counselor_profiles` (`id`);

--
-- Các ràng buộc cho bảng `email_verification_tokens`
--
ALTER TABLE `email_verification_tokens`
  ADD CONSTRAINT `email_verification_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`counselor_id`) REFERENCES `counselor_profiles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
