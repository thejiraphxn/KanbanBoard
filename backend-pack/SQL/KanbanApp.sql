-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Apr 13, 2025 at 10:55 PM
-- Server version: 5.7.39
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `KanbanApp`
--

-- --------------------------------------------------------

--
-- Table structure for table `kb_board`
--

CREATE TABLE `kb_board` (
  `bd_id` varchar(30) NOT NULL,
  `bd_project_name` varchar(30) NOT NULL,
  `bd_description` text,
  `bd_start_date` datetime NOT NULL,
  `bd_end_date` datetime DEFAULT NULL,
  `mb_id` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `kb_board_detail`
--

CREATE TABLE `kb_board_detail` (
  `dt_id` varchar(30) NOT NULL,
  `bd_id` varchar(30) NOT NULL,
  `dt_list_title` varchar(50) NOT NULL,
  `dt_process` enum('1','2','3','4') NOT NULL,
  `dt_start_timestamp` datetime NOT NULL,
  `dt_process_timestamp` datetime NOT NULL,
  `mb_id` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `kb_board_tags`
--

CREATE TABLE `kb_board_tags` (
  `bt_id` int(10) NOT NULL,
  `bd_id` varchar(30) NOT NULL,
  `bt_title` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `kb_invite`
--

CREATE TABLE `kb_invite` (
  `iv_id` int(10) NOT NULL,
  `bd_id` varchar(30) NOT NULL,
  `iv_inviter` varchar(15) NOT NULL,
  `iv_guest` varchar(15) NOT NULL,
  `iv_invite_time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `kb_member`
--

CREATE TABLE `kb_member` (
  `mb_id` varchar(15) NOT NULL,
  `mb_username` varchar(50) NOT NULL,
  `mb_email` varchar(255) NOT NULL,
  `mb_firstname` varchar(150) NOT NULL,
  `mb_lastname` varchar(150) NOT NULL,
  `mb_password` varchar(255) NOT NULL,
  `mb_registered_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `kb_member`
--

INSERT INTO `kb_member` (`mb_id`, `mb_username`, `mb_email`, `mb_firstname`, `mb_lastname`, `mb_password`, `mb_registered_date`) VALUES
('0A1130CA27DB46F', 'brianvo', 'brian@example.com', 'Brian', 'Vo', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 11:10:00'),
('116BCD2DF7B44C', 'michaelchen', 'michael@example.com', 'Michael', 'Chen', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:10:00'),
('1B1D8A12FF0546', 'jacobliew', 'jacob@example.com', 'Jacob', 'Liew', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 11:20:00'),
('24179312071F469', 'meganho', 'megan@example.com', 'Megan', 'Ho', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 11:35:00'),
('259A1E2554EE40', 'sophianguyen', 'sophia@example.com', 'Sophia', 'Nguyen', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:45:00'),
('2BA26FD0D2314C', 'chloelim', 'chloe@example.com', 'Chloe', 'Lim', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 11:25:00'),
('3423A4BFABE340', 'davidkim', 'david@example.com', 'David', 'Kim', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:30:00'),
('39A17B19ECCC4C', 'elizabethcho', 'elizabeth@example.com', 'Elizabeth', 'Cho', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 11:05:00'),
('3AA8EE5ACBDC48C', 'nataliepark', 'natalie@example.com', 'Natalie', 'Park', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:25:00'),
('4E3BCCEDCD88462', 'danielwhite', 'daniel@example.com', 'Daniel', 'White', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:50:00'),
('8D9FAA75323646', 'sarajohnson', 'sara@example.com', 'Sara', 'Johnson', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:15:00'),
('8EF46BEA890B49A', 'ryanthai', 'ryan@example.com', 'Ryan', 'Thai', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 11:00:00'),
('A1AD2E0193FF41', 'emilywong', 'emily@example.com', 'Emily', 'Wong', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:05:00'),
('A48F321FF45F41', 'ethansim', 'ethan@example.com', 'Ethan', 'Sim', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 11:30:00'),
('A78AA708F9B54E8', 'johnsmith', 'john@example.com', 'John', 'Smith', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:00:00'),
('C6D7C427D22248', 'jasonbrown', 'jason@example.com', 'Jason', 'Brown', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:40:00'),
('F55693B5464445', 'gracepham', 'grace@example.com', 'Grace', 'Pham', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 11:15:00'),
('F9D071546278465', 'alexlee', 'alex@example.com', 'Alex', 'Lee', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:20:00'),
('FB053A06408B4A8', 'oliviatran', 'olivia@example.com', 'Olivia', 'Tran', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:55:00'),
('FC880B37361442', 'lauragarcia', 'laura@example.com', 'Laura', 'Garcia', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-13 10:35:00'),
('hBA8iHU7CucjgQh', 'johndoe', 'johndoe@gmail.com', 'John', 'Doe', '$2b$12$lTbbTID/K2xVHMzzFNXezez2O5.omVx4uSD3w5WDbvNZ2jbaKJpi6', '2025-04-12 17:53:36'),
('TBHG5qb77FYn4AB', 'Jiraphon153', 'chen@example.com', 'Chen', 'Test', '$2b$12$8Uym9V3upkJNSlF/pLeoo.FH31Huug.nb1ZVFeRI17ogXkpgOO/I.', '2025-04-11 01:28:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `kb_board`
--
ALTER TABLE `kb_board`
  ADD PRIMARY KEY (`bd_id`),
  ADD KEY `kb_board_ibfk_1` (`mb_id`);

--
-- Indexes for table `kb_board_detail`
--
ALTER TABLE `kb_board_detail`
  ADD PRIMARY KEY (`dt_id`),
  ADD KEY `kb_board_detail_ibfk_2` (`mb_id`),
  ADD KEY `kb_board_detail_ibfk_1` (`bd_id`);

--
-- Indexes for table `kb_board_tags`
--
ALTER TABLE `kb_board_tags`
  ADD PRIMARY KEY (`bt_id`),
  ADD KEY `kb_board_tags_ibfk_1` (`bd_id`);

--
-- Indexes for table `kb_invite`
--
ALTER TABLE `kb_invite`
  ADD PRIMARY KEY (`iv_id`),
  ADD KEY `kb_invite_ibfk_1` (`bd_id`),
  ADD KEY `kb_invite_ibfk_2` (`iv_inviter`),
  ADD KEY `kb_invite_ibfk_3` (`iv_guest`);

--
-- Indexes for table `kb_member`
--
ALTER TABLE `kb_member`
  ADD PRIMARY KEY (`mb_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `kb_board_tags`
--
ALTER TABLE `kb_board_tags`
  MODIFY `bt_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kb_invite`
--
ALTER TABLE `kb_invite`
  MODIFY `iv_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `kb_board`
--
ALTER TABLE `kb_board`
  ADD CONSTRAINT `kb_board_ibfk_1` FOREIGN KEY (`mb_id`) REFERENCES `kb_member` (`mb_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `kb_board_detail`
--
ALTER TABLE `kb_board_detail`
  ADD CONSTRAINT `kb_board_detail_ibfk_1` FOREIGN KEY (`bd_id`) REFERENCES `kb_board` (`bd_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `kb_board_detail_ibfk_2` FOREIGN KEY (`mb_id`) REFERENCES `kb_member` (`mb_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `kb_board_tags`
--
ALTER TABLE `kb_board_tags`
  ADD CONSTRAINT `kb_board_tags_ibfk_1` FOREIGN KEY (`bd_id`) REFERENCES `kb_board` (`bd_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `kb_invite`
--
ALTER TABLE `kb_invite`
  ADD CONSTRAINT `kb_invite_ibfk_1` FOREIGN KEY (`bd_id`) REFERENCES `kb_board` (`bd_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `kb_invite_ibfk_2` FOREIGN KEY (`iv_inviter`) REFERENCES `kb_member` (`mb_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `kb_invite_ibfk_3` FOREIGN KEY (`iv_guest`) REFERENCES `kb_member` (`mb_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
