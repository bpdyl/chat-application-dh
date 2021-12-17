START TRANSACTION;
CREATE TABLE IF NOT EXISTS "django_migrations" (
	"id"	integer NOT NULL,
	"app"	varchar(255) NOT NULL,
	"name"	varchar(255) NOT NULL,
	"applied"	datetime NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "auth_user_groups" (
	"id"	integer NOT NULL,
	"user_id"	integer NOT NULL,
	"group_id"	integer NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("user_id") REFERENCES "auth_user"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("group_id") REFERENCES "auth_group"("id") DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE IF NOT EXISTS "auth_user_user_permissions" (
	"id"	integer NOT NULL,
	"user_id"	integer NOT NULL,
	"permission_id"	integer NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("permission_id") REFERENCES "auth_permission"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("user_id") REFERENCES "auth_user"("id") DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE IF NOT EXISTS "auth_user" (
	"id"	integer NOT NULL,
	"password"	varchar(128) NOT NULL,
	"last_login"	datetime,
	"is_superuser"	bool NOT NULL,
	"username"	varchar(150) NOT NULL UNIQUE,
	"last_name"	varchar(150) NOT NULL,
	"email"	varchar(254) NOT NULL,
	"is_staff"	bool NOT NULL,
	"is_active"	bool NOT NULL,
	"date_joined"	datetime NOT NULL,
	"first_name"	varchar(150) NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "django_content_type" (
	"id"	integer NOT NULL,
	"app_label"	varchar(100) NOT NULL,
	"model"	varchar(100) NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "auth_group_permissions" (
	"id"	integer NOT NULL,
	"group_id"	integer NOT NULL,
	"permission_id"	integer NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("group_id") REFERENCES "auth_group"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("permission_id") REFERENCES "auth_permission"("id") DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE IF NOT EXISTS "auth_permission" (
	"id"	integer NOT NULL,
	"content_type_id"	integer NOT NULL,
	"codename"	varchar(100) NOT NULL,
	"name"	varchar(255) NOT NULL,
	FOREIGN KEY("content_type_id") REFERENCES "django_content_type"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "auth_group" (
	"id"	integer NOT NULL,
	"name"	varchar(150) NOT NULL UNIQUE,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "accounts_customuser_groups" (
	"id"	integer NOT NULL,
	"customuser_id"	bigint NOT NULL,
	"group_id"	integer NOT NULL,
	FOREIGN KEY("group_id") REFERENCES "auth_group"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("customuser_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "accounts_customuser_user_permissions" (
	"id"	integer NOT NULL,
	"customuser_id"	bigint NOT NULL,
	"permission_id"	integer NOT NULL,
	FOREIGN KEY("permission_id") REFERENCES "auth_permission"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("customuser_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "django_admin_log" (
	"id"	integer NOT NULL,
	"action_time"	datetime NOT NULL,
	"object_id"	text,
	"object_repr"	varchar(200) NOT NULL,
	"change_message"	text NOT NULL,
	"content_type_id"	integer,
	"user_id"	bigint NOT NULL,
	"action_flag"	smallint unsigned NOT NULL CHECK("action_flag" >= 0),
	FOREIGN KEY("user_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("content_type_id") REFERENCES "django_content_type"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "django_session" (
	"session_key"	varchar(40) NOT NULL,
	"session_data"	text NOT NULL,
	"expire_date"	datetime NOT NULL,
	PRIMARY KEY("session_key")
);
CREATE TABLE IF NOT EXISTS "accounts_customuser" (
	"id"	integer NOT NULL,
	"password"	varchar(128) NOT NULL,
	"is_superuser"	bool NOT NULL,
	"first_name"	varchar(150) NOT NULL,
	"last_name"	varchar(150) NOT NULL,
	"is_staff"	bool NOT NULL,
	"is_active"	bool NOT NULL,
	"date_joined"	datetime NOT NULL,
	"email"	varchar(254) NOT NULL UNIQUE,
	"hide_email"	bool NOT NULL,
	"is_admin"	bool NOT NULL,
	"profile_image"	varchar(255),
	"username"	varchar(30) NOT NULL UNIQUE,
	"last_login"	datetime NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "friends_friendrequest" (
	"id"	integer NOT NULL,
	"is_pending"	bool NOT NULL,
	"timestamp"	datetime NOT NULL,
	"receiver_id"	bigint NOT NULL,
	"sender_id"	bigint NOT NULL,
	FOREIGN KEY("sender_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("receiver_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "friends_friendlist" (
	"id"	integer NOT NULL,
	"user_id"	bigint NOT NULL UNIQUE,
	FOREIGN KEY("user_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "friends_friendlist_friends" (
	"id"	integer NOT NULL,
	"friendlist_id"	bigint NOT NULL,
	"customuser_id"	bigint NOT NULL,
	FOREIGN KEY("customuser_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("friendlist_id") REFERENCES "friends_friendlist"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "core_groupchatthread" (
	"group_ptr_id"	integer NOT NULL,
	"group_name"	varchar(100),
	"image"	varchar(100) NOT NULL,
	"group_description"	text NOT NULL,
	"created_at"	datetime NOT NULL,
	"updated_at"	datetime NOT NULL,
	"admin_id"	bigint,
	FOREIGN KEY("group_ptr_id") REFERENCES "auth_group"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("group_ptr_id"),
	FOREIGN KEY("admin_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE IF NOT EXISTS "core_privatechatthread" (
	"id"	integer NOT NULL,
	"timestamp"	datetime NOT NULL,
	"updated_at"	datetime NOT NULL,
	"first_user_id"	bigint,
	"second_user_id"	bigint,
	FOREIGN KEY("first_user_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("second_user_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "core_privatechatmessage" (
	"id"	integer NOT NULL,
	"timestamp"	datetime NOT NULL,
	"chat_thread_id"	bigint,
	"sender_id"	bigint NOT NULL,
	FOREIGN KEY("sender_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("chat_thread_id") REFERENCES "core_privatechatthread"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "core_groupchatmessage" (
	"id"	integer NOT NULL,
	"timestamp"	datetime NOT NULL,
	"message_type"	varchar(50),
	"content"	text NOT NULL,
	"gc_thread_id"	integer NOT NULL,
	"sender_id"	bigint NOT NULL,
	FOREIGN KEY("gc_thread_id") REFERENCES "core_groupchatthread"("group_ptr_id") DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY("sender_id") REFERENCES "accounts_customuser"("id") DEFERRABLE INITIALLY DEFERRED,
	PRIMARY KEY("id" AUTOINCREMENT)
);
INSERT INTO "django_migrations" VALUES (38,'contenttypes','0001_initial','2021-11-07 10:42:38.968597');
INSERT INTO "django_migrations" VALUES (39,'contenttypes','0002_remove_content_type_name','2021-11-07 10:42:39.061031');
INSERT INTO "django_migrations" VALUES (40,'auth','0001_initial','2021-11-07 10:42:39.258930');
INSERT INTO "django_migrations" VALUES (41,'auth','0002_alter_permission_name_max_length','2021-11-07 10:42:39.354934');
INSERT INTO "django_migrations" VALUES (42,'auth','0003_alter_user_email_max_length','2021-11-07 10:42:39.436638');
INSERT INTO "django_migrations" VALUES (43,'auth','0004_alter_user_username_opts','2021-11-07 10:42:39.518533');
INSERT INTO "django_migrations" VALUES (44,'auth','0005_alter_user_last_login_null','2021-11-07 10:42:39.619044');
INSERT INTO "django_migrations" VALUES (45,'auth','0006_require_contenttypes_0002','2021-11-07 10:42:39.697636');
INSERT INTO "django_migrations" VALUES (46,'auth','0007_alter_validators_add_error_messages','2021-11-07 10:42:39.788176');
INSERT INTO "django_migrations" VALUES (47,'auth','0008_alter_user_username_max_length','2021-11-07 10:42:39.874226');
INSERT INTO "django_migrations" VALUES (48,'auth','0009_alter_user_last_name_max_length','2021-11-07 10:42:39.958258');
INSERT INTO "django_migrations" VALUES (49,'auth','0010_alter_group_name_max_length','2021-11-07 10:42:40.042706');
INSERT INTO "django_migrations" VALUES (50,'auth','0011_update_proxy_permissions','2021-11-07 10:42:40.125337');
INSERT INTO "django_migrations" VALUES (51,'auth','0012_alter_user_first_name_max_length','2021-11-07 10:42:40.213374');
INSERT INTO "django_migrations" VALUES (52,'accounts','0001_initial','2021-11-07 10:42:40.386580');
INSERT INTO "django_migrations" VALUES (53,'admin','0001_initial','2021-11-07 10:43:53.775205');
INSERT INTO "django_migrations" VALUES (54,'admin','0002_logentry_remove_auto_add','2021-11-07 10:43:53.876282');
INSERT INTO "django_migrations" VALUES (55,'admin','0003_logentry_add_action_flag_choices','2021-11-07 10:43:53.985956');
INSERT INTO "django_migrations" VALUES (56,'core','0001_initial','2021-11-07 10:43:54.087630');
INSERT INTO "django_migrations" VALUES (57,'sessions','0001_initial','2021-11-07 10:43:54.285083');
INSERT INTO "django_migrations" VALUES (58,'accounts','0002_auto_20211107_1719','2021-11-07 11:35:02.919906');
INSERT INTO "django_migrations" VALUES (59,'friends','0001_initial','2021-11-15 07:04:49.978271');
INSERT INTO "django_migrations" VALUES (60,'core','0002_auto_20211118_0503','2021-11-17 23:18:47.158577');
INSERT INTO "django_migrations" VALUES (61,'friends','0002_auto_20211118_0503','2021-11-17 23:18:47.312768');
INSERT INTO "auth_user" VALUES (1,'pbkdf2_sha256$260000$ubvGGbkwX73g2A72vg1ieF$iHMJSnL4ltee7wPFWn6CjG3KfsHcuEfqir6u3upoFOE=','2021-10-27 10:36:13.225646',1,'bibek','','bibek@gmail.com',1,1,'2021-10-27 10:35:51.655317','');
INSERT INTO "django_content_type" VALUES (1,'auth','permission');
INSERT INTO "django_content_type" VALUES (2,'auth','group');
INSERT INTO "django_content_type" VALUES (3,'contenttypes','contenttype');
INSERT INTO "django_content_type" VALUES (4,'accounts','customuser');
INSERT INTO "django_content_type" VALUES (5,'admin','logentry');
INSERT INTO "django_content_type" VALUES (6,'sessions','session');
INSERT INTO "django_content_type" VALUES (7,'core','groupchat');
INSERT INTO "django_content_type" VALUES (8,'friends','friendlist');
INSERT INTO "django_content_type" VALUES (9,'friends','friendrequest');
INSERT INTO "django_content_type" VALUES (10,'core','privatechatthread');
INSERT INTO "django_content_type" VALUES (11,'core','groupchatmessage');
INSERT INTO "django_content_type" VALUES (12,'core','privatechatmessage');
INSERT INTO "django_content_type" VALUES (13,'core','groupchatthread');
INSERT INTO "auth_permission" VALUES (1,1,'add_permission','Can add permission');
INSERT INTO "auth_permission" VALUES (2,1,'change_permission','Can change permission');
INSERT INTO "auth_permission" VALUES (3,1,'delete_permission','Can delete permission');
INSERT INTO "auth_permission" VALUES (4,1,'view_permission','Can view permission');
INSERT INTO "auth_permission" VALUES (5,2,'add_group','Can add group');
INSERT INTO "auth_permission" VALUES (6,2,'change_group','Can change group');
INSERT INTO "auth_permission" VALUES (7,2,'delete_group','Can delete group');
INSERT INTO "auth_permission" VALUES (8,2,'view_group','Can view group');
INSERT INTO "auth_permission" VALUES (9,3,'add_contenttype','Can add content type');
INSERT INTO "auth_permission" VALUES (10,3,'change_contenttype','Can change content type');
INSERT INTO "auth_permission" VALUES (11,3,'delete_contenttype','Can delete content type');
INSERT INTO "auth_permission" VALUES (12,3,'view_contenttype','Can view content type');
INSERT INTO "auth_permission" VALUES (13,4,'add_customuser','Can add user');
INSERT INTO "auth_permission" VALUES (14,4,'change_customuser','Can change user');
INSERT INTO "auth_permission" VALUES (15,4,'delete_customuser','Can delete user');
INSERT INTO "auth_permission" VALUES (16,4,'view_customuser','Can view user');
INSERT INTO "auth_permission" VALUES (17,5,'add_logentry','Can add log entry');
INSERT INTO "auth_permission" VALUES (18,5,'change_logentry','Can change log entry');
INSERT INTO "auth_permission" VALUES (19,5,'delete_logentry','Can delete log entry');
INSERT INTO "auth_permission" VALUES (20,5,'view_logentry','Can view log entry');
INSERT INTO "auth_permission" VALUES (21,6,'add_session','Can add session');
INSERT INTO "auth_permission" VALUES (22,6,'change_session','Can change session');
INSERT INTO "auth_permission" VALUES (23,6,'delete_session','Can delete session');
INSERT INTO "auth_permission" VALUES (24,6,'view_session','Can view session');
INSERT INTO "auth_permission" VALUES (25,7,'add_groupchat','Can add group chat');
INSERT INTO "auth_permission" VALUES (26,7,'change_groupchat','Can change group chat');
INSERT INTO "auth_permission" VALUES (27,7,'delete_groupchat','Can delete group chat');
INSERT INTO "auth_permission" VALUES (28,7,'view_groupchat','Can view group chat');
INSERT INTO "auth_permission" VALUES (29,8,'add_friendlist','Can add friend list');
INSERT INTO "auth_permission" VALUES (30,8,'change_friendlist','Can change friend list');
INSERT INTO "auth_permission" VALUES (31,8,'delete_friendlist','Can delete friend list');
INSERT INTO "auth_permission" VALUES (32,8,'view_friendlist','Can view friend list');
INSERT INTO "auth_permission" VALUES (33,9,'add_friendrequest','Can add friend request');
INSERT INTO "auth_permission" VALUES (34,9,'change_friendrequest','Can change friend request');
INSERT INTO "auth_permission" VALUES (35,9,'delete_friendrequest','Can delete friend request');
INSERT INTO "auth_permission" VALUES (36,9,'view_friendrequest','Can view friend request');
INSERT INTO "auth_permission" VALUES (37,10,'add_privatechatthread','Can add private chat thread');
INSERT INTO "auth_permission" VALUES (38,10,'change_privatechatthread','Can change private chat thread');
INSERT INTO "auth_permission" VALUES (39,10,'delete_privatechatthread','Can delete private chat thread');
INSERT INTO "auth_permission" VALUES (40,10,'view_privatechatthread','Can view private chat thread');
INSERT INTO "auth_permission" VALUES (41,11,'add_groupchatmessage','Can add group chat message');
INSERT INTO "auth_permission" VALUES (42,11,'change_groupchatmessage','Can change group chat message');
INSERT INTO "auth_permission" VALUES (43,11,'delete_groupchatmessage','Can delete group chat message');
INSERT INTO "auth_permission" VALUES (44,11,'view_groupchatmessage','Can view group chat message');
INSERT INTO "auth_permission" VALUES (45,12,'add_privatechatmessage','Can add private chat message');
INSERT INTO "auth_permission" VALUES (46,12,'change_privatechatmessage','Can change private chat message');
INSERT INTO "auth_permission" VALUES (47,12,'delete_privatechatmessage','Can delete private chat message');
INSERT INTO "auth_permission" VALUES (48,12,'view_privatechatmessage','Can view private chat message');
INSERT INTO "auth_permission" VALUES (49,13,'add_groupchatthread','Can add group chat thread');
INSERT INTO "auth_permission" VALUES (50,13,'change_groupchatthread','Can change group chat thread');
INSERT INTO "auth_permission" VALUES (51,13,'delete_groupchatthread','Can delete group chat thread');
INSERT INTO "auth_permission" VALUES (52,13,'view_groupchatthread','Can view group chat thread');
INSERT INTO "auth_group" VALUES (2,'Hakuna Matata');
INSERT INTO "accounts_customuser_groups" VALUES (1,1,2);
INSERT INTO "django_admin_log" VALUES (1,'2021-11-07 11:39:18.038417','2','cupid@gmail.com','[{"added": {}}]',4,1,1);
INSERT INTO "django_admin_log" VALUES (2,'2021-11-07 11:41:55.360084','3','rojin@gmail.com','[{"added": {}}]',4,1,1);
INSERT INTO "django_admin_log" VALUES (3,'2021-11-07 11:42:58.529140','2','cupid@gmail.com','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (4,'2021-11-07 11:44:34.005376','2','cupid@gmail.com','[{"changed": {"fields": ["Username"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (5,'2021-11-07 11:58:00.165520','1','bibeksuperuser','[{"changed": {"fields": ["Is admin"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (6,'2021-11-10 15:10:55.020182','1','bibeksuperuser','[{"changed": {"fields": ["First name", "Last name"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (7,'2021-11-10 15:11:06.361493','2','cupid','[{"changed": {"fields": ["First name", "Last name"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (8,'2021-11-10 15:11:16.963853','4','jagga','[{"changed": {"fields": ["First name", "Last name"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (9,'2021-11-10 15:11:27.316545','3','rojinstha','[{"changed": {"fields": ["First name", "Last name"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (10,'2021-11-15 07:10:26.609170','1','rojinstha','[{"added": {}}]',8,1,1);
INSERT INTO "django_admin_log" VALUES (11,'2021-11-15 07:11:35.137080','1','mygroup','[{"added": {}}]',2,1,1);
INSERT INTO "django_admin_log" VALUES (12,'2021-11-15 07:11:46.849715','1','mygroup','',2,1,3);
INSERT INTO "django_admin_log" VALUES (13,'2021-11-17 23:24:05.011816','2','Hakuna Matata','[{"added": {}}]',13,1,1);
INSERT INTO "django_admin_log" VALUES (14,'2021-11-21 08:48:16.322745','2','cupid','[{"changed": {"fields": ["Hide email"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (15,'2021-11-21 08:51:12.165264','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (16,'2021-11-22 02:03:13.196168','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (17,'2021-11-22 02:04:55.980013','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (18,'2021-11-22 02:05:15.727729','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (19,'2021-11-22 02:05:43.455323','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (20,'2021-11-22 02:25:41.319415','5','bp','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (21,'2021-11-22 05:19:01.003323','1','bibeksuperuser','[{"changed": {"fields": ["Last name"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (22,'2021-11-22 05:32:12.819784','1','bibeksuperuser','[{"changed": {"fields": ["Hide email"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (23,'2021-11-22 05:33:06.590608','1','bibeksuperuser','[{"changed": {"fields": ["First name", "Hide email"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (24,'2021-11-22 06:05:42.713246','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (25,'2021-11-22 06:05:47.964194','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (26,'2021-11-22 10:39:59.022502','1','1','[{"changed": {"fields": ["Username"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (27,'2021-11-22 10:40:10.550241','1','bibeksuperuser','[{"changed": {"fields": ["Username"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (28,'2021-11-22 11:30:37.825321','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (29,'2021-11-22 11:49:00.225682','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (30,'2021-11-22 11:49:38.817762','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (31,'2021-11-22 12:00:22.324542','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (32,'2021-11-22 12:00:49.203288','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (33,'2021-11-22 12:15:09.824972','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (34,'2021-11-22 12:15:32.663099','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (35,'2021-11-22 12:16:11.309917','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (36,'2021-11-22 12:16:31.613628','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (37,'2021-11-22 13:17:30.855226','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (38,'2021-11-22 13:18:32.541735','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (39,'2021-11-22 13:19:34.868504','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (40,'2021-11-22 13:20:09.132576','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (41,'2021-11-22 13:20:32.325273','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (42,'2021-11-22 13:21:24.861854','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (43,'2021-11-22 13:22:15.300294','1','bibeksuperuser','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (44,'2021-11-22 13:32:19.419287','5','bp','[]',4,1,2);
INSERT INTO "django_admin_log" VALUES (45,'2021-11-22 13:34:15.161825','5','bp','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (46,'2021-11-22 13:34:38.115704','1','bibeksuperuser','[{"changed": {"fields": ["Profile image"]}}]',4,1,2);
INSERT INTO "django_admin_log" VALUES (47,'2021-11-22 13:35:54.492337','1','bibeksuperuser','[{"changed": {"fields": ["Hide email"]}}]',4,1,2);
INSERT INTO "django_session" VALUES ('497h3f8ypsn4ndd5ybaquc5ev7kzemjv','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1mkoQ8:ySkwnLxOAWK0TYyu-YfE_zeTugCfWdF8KmaWHjG2axo','2021-11-24 14:17:48.545282');
INSERT INTO "django_session" VALUES ('g1pciu9t6y8bibddr71ngsph7wfaj8xj','e30:1mkooa:ZaulIdlzTI7441l6ePnYdjR7BPafvpAoiLpISryGad0','2021-11-24 14:43:04.380975');
INSERT INTO "django_session" VALUES ('95an6wm8fa8glhbdeztxqcikfc10fux6','e30:1mkp7s:hq93JkFUBjSXMX52DMJ6Uo8IpfZCkmPXUGKR8phgpSU','2021-11-24 15:03:00.716714');
INSERT INTO "django_session" VALUES ('773iu2ayszj96jvzklnfrnqpqu1wierc','e30:1ml6Jp:bk6sa05VTZtY16AB61-5tfqIKwIGQ32cO8b7FehPTpU','2021-11-25 09:24:29.565361');
INSERT INTO "django_session" VALUES ('dbkwo3m1bsf2wnbbagwb1wcbrmqlijoy','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1ml6Pd:e_RihtMGyQVVFJrj9QtqRejuZePNClGXhJvYtaUk3vc','2021-11-25 09:30:29.060801');
INSERT INTO "django_session" VALUES ('jhosb7her9nmchv2vhhizfj2vlzy45rl','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1mnUEK:Ca54JDBYF8SdhYQEN90Rl7vyeKBy9fms9TILK47yQfw','2021-12-01 23:20:40.626754');
INSERT INTO "django_session" VALUES ('vlcjlzswwup45f0n15zngpcnxujtvchx','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1moem7:bAfL-4XK1-UF29BSWQGHbP6PJYDHPtSlR208cllCQU4','2021-12-05 04:48:23.195503');
INSERT INTO "django_session" VALUES ('y5cz4qjbjxr82v60mip1rhnpdjouxtd7','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1moi8r:8nd68deS0AuiAapWcWfziszqg8s-gSeUThUNE0huKTE','2021-12-05 08:24:05.691894');
INSERT INTO "django_session" VALUES ('04twotrtg73m0911u2f17zijmj255e30','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1moyf2:3LdCKCXECRlaq7HkWHDKciQpOlODZ1n41dUQP-DDELE','2021-12-06 02:02:24.499986');
INSERT INTO "django_session" VALUES ('13rzt8xq8umlt58v54w4yt5ewzmblnk6','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1mp6ie:qnrSMniQ9ULd2ejXqaKUE02CLYFl-HGxcKnmM3GtF7I','2021-12-06 10:38:40.084408');
INSERT INTO "django_session" VALUES ('iwyk5w1p4r4gowrer7nz0jki7ikr6xw4','e30:1mp7VL:60q7t-0bfslmMJAlN6DBtRQcsHRi_u_KH7PUta342nc','2021-12-06 11:28:59.604745');
INSERT INTO "django_session" VALUES ('shjx2muq1rvv04nroblgjrylqm2vz3gs','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1mp7Wj:v_K5fmINByal_k3h_KI_3ugAPrdBXtxCaLkP7vojNEw','2021-12-06 11:30:25.053073');
INSERT INTO "django_session" VALUES ('1g1y1ha9dln6081fafbhj4bxm3mdjenv','.eJxVjEEOwiAQRe_C2hBgaIe6dO8ZCMNMpWpoUtqV8e7apAvd_vfef6mYtrXErckSJ1ZnZdXpd6OUH1J3wPdUb7POc12XifSu6IM2fZ1ZnpfD_TsoqZVvDUBjRvDMnTVkHTEMbPrgyXliTOLcaAFzAAwdImcP1IcgzjpLgxj1_gDcuTdo:1mpLjT:vPmEl5iI2owAonf700BHc84XSgWyTZSbgUbaho7KbNA','2021-12-07 02:40:31.448298');
INSERT INTO "accounts_customuser" VALUES (1,'pbkdf2_sha256$260000$t7WR66G5RdeHLX4HSExZyZ$rsaTsPwlX0tUzPTnWMm7n5YyJTxQb0AZBQ3lWZEEPbs=',1,'Bibek','Paudyal',1,1,'2021-11-07 10:46:23.511160','bibek@gmail.com',1,1,'user_photos/nouser.jpg','bibeksuperuser','2021-11-23 05:10:41.166408');
INSERT INTO "accounts_customuser" VALUES (2,'pbkdf2_sha256$260000$lEu8MgwQG0FYcEFxyNFQdJ$tXAkH0MNwRANCsysR0Hftbh+CmOvUyqqtU6HePtqhMY=',0,'Cupid','noob',0,1,'2021-11-07 11:39:18.038417','cupid@gmail.com',0,0,'user_photos/nouser.jpg','cupid','2021-11-21 08:48:14.555281');
INSERT INTO "accounts_customuser" VALUES (3,'pbkdf2_sha256$260000$KqNLukO05vGJk6BFbJmqX2$PNV/RgZPYz/8eqE3eatiSQvbRt9NJL7gwwHa53YGe8w=',0,'Rojin','Shrestha',0,1,'2021-11-07 11:41:55.352054','rojin@gmail.com',1,0,'user_photos/nouser.jpg','rojinstha','2021-11-10 15:11:27.316545');
INSERT INTO "accounts_customuser" VALUES (4,'pbkdf2_sha256$260000$JbWJ4WDKhwbWxAkRA8rgK1$DRi4MPTJ+ZVI8lGw8vvdLUqpnAKG2+DgORt6yMb/fYU=',1,'Jagga','Daku',1,1,'2021-11-07 11:55:50.467738','jagga@gmail.com',1,1,'user_photos/nouser.jpg','jagga','2021-11-10 15:11:16.963853');
INSERT INTO "accounts_customuser" VALUES (5,'pbkdf2_sha256$260000$s5Ynx5cNFYpNmjhylHUufR$W8r7WPskZanVAHQCrJ+ptCqSfum+WioWDxRBRQKEOIA=',0,'b','p',0,1,'2021-11-10 15:04:57.067981','bp@gmail.com',1,0,'user_photos/tomioka-giyuu.jpg','bp','2021-11-22 13:34:15.113149');
INSERT INTO "friends_friendlist" VALUES (1,3);
INSERT INTO "friends_friendlist" VALUES (2,1);
INSERT INTO "friends_friendlist" VALUES (3,2);
INSERT INTO "friends_friendlist" VALUES (4,5);
INSERT INTO "friends_friendlist" VALUES (5,4);
INSERT INTO "friends_friendlist_friends" VALUES (1,1,1);
INSERT INTO "friends_friendlist_friends" VALUES (2,1,2);
INSERT INTO "friends_friendlist_friends" VALUES (3,1,5);
INSERT INTO "core_groupchatthread" VALUES (2,'Hakuna Matata','group_photos/a.jpeg.png','no worries','2021-11-17 23:24:05.006810','2021-11-17 23:24:05.006810',1);
CREATE UNIQUE INDEX IF NOT EXISTS "auth_user_groups_user_id_group_id_94350c0c_uniq" ON "auth_user_groups" (
	"user_id",
	"group_id"
);
CREATE INDEX IF NOT EXISTS "auth_user_groups_user_id_6a12ed8b" ON "auth_user_groups" (
	"user_id"
);
CREATE INDEX IF NOT EXISTS "auth_user_groups_group_id_97559544" ON "auth_user_groups" (
	"group_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "auth_user_user_permissions_user_id_permission_id_14a6b632_uniq" ON "auth_user_user_permissions" (
	"user_id",
	"permission_id"
);
CREATE INDEX IF NOT EXISTS "auth_user_user_permissions_user_id_a95ead1b" ON "auth_user_user_permissions" (
	"user_id"
);
CREATE INDEX IF NOT EXISTS "auth_user_user_permissions_permission_id_1fbb5f2c" ON "auth_user_user_permissions" (
	"permission_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "django_content_type_app_label_model_76bd3d3b_uniq" ON "django_content_type" (
	"app_label",
	"model"
);
CREATE UNIQUE INDEX IF NOT EXISTS "auth_group_permissions_group_id_permission_id_0cd325b0_uniq" ON "auth_group_permissions" (
	"group_id",
	"permission_id"
);
CREATE INDEX IF NOT EXISTS "auth_group_permissions_group_id_b120cbf9" ON "auth_group_permissions" (
	"group_id"
);
CREATE INDEX IF NOT EXISTS "auth_group_permissions_permission_id_84c5c92e" ON "auth_group_permissions" (
	"permission_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "auth_permission_content_type_id_codename_01ab375a_uniq" ON "auth_permission" (
	"content_type_id",
	"codename"
);
CREATE INDEX IF NOT EXISTS "auth_permission_content_type_id_2f476e4b" ON "auth_permission" (
	"content_type_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_customuser_groups_customuser_id_group_id_c074bdcb_uniq" ON "accounts_customuser_groups" (
	"customuser_id",
	"group_id"
);
CREATE INDEX IF NOT EXISTS "accounts_customuser_groups_customuser_id_bc55088e" ON "accounts_customuser_groups" (
	"customuser_id"
);
CREATE INDEX IF NOT EXISTS "accounts_customuser_groups_group_id_86ba5f9e" ON "accounts_customuser_groups" (
	"group_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_customuser_user_permissions_customuser_id_permission_id_9632a709_uniq" ON "accounts_customuser_user_permissions" (
	"customuser_id",
	"permission_id"
);
CREATE INDEX IF NOT EXISTS "accounts_customuser_user_permissions_customuser_id_0deaefae" ON "accounts_customuser_user_permissions" (
	"customuser_id"
);
CREATE INDEX IF NOT EXISTS "accounts_customuser_user_permissions_permission_id_aea3d0e5" ON "accounts_customuser_user_permissions" (
	"permission_id"
);
CREATE INDEX IF NOT EXISTS "django_admin_log_content_type_id_c4bce8eb" ON "django_admin_log" (
	"content_type_id"
);
CREATE INDEX IF NOT EXISTS "django_admin_log_user_id_c564eba6" ON "django_admin_log" (
	"user_id"
);
CREATE INDEX IF NOT EXISTS "django_session_expire_date_a5c62663" ON "django_session" (
	"expire_date"
);
CREATE INDEX IF NOT EXISTS "friends_friendrequest_receiver_id_841d26ee" ON "friends_friendrequest" (
	"receiver_id"
);
CREATE INDEX IF NOT EXISTS "friends_friendrequest_sender_id_0f1ff19f" ON "friends_friendrequest" (
	"sender_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "friends_friendlist_friends_friendlist_id_customuser_id_a3c9c2e1_uniq" ON "friends_friendlist_friends" (
	"friendlist_id",
	"customuser_id"
);
CREATE INDEX IF NOT EXISTS "friends_friendlist_friends_friendlist_id_5bfeca0c" ON "friends_friendlist_friends" (
	"friendlist_id"
);
CREATE INDEX IF NOT EXISTS "friends_friendlist_friends_customuser_id_49ea4af0" ON "friends_friendlist_friends" (
	"customuser_id"
);
CREATE INDEX IF NOT EXISTS "core_groupchatthread_admin_id_a33edccb" ON "core_groupchatthread" (
	"admin_id"
);
CREATE UNIQUE INDEX IF NOT EXISTS "core_privatechatthread_first_user_id_second_user_id_de443d33_uniq" ON "core_privatechatthread" (
	"first_user_id",
	"second_user_id"
);
CREATE INDEX IF NOT EXISTS "core_privatechatthread_first_user_id_06d751a4" ON "core_privatechatthread" (
	"first_user_id"
);
CREATE INDEX IF NOT EXISTS "core_privatechatthread_second_user_id_7f7ac892" ON "core_privatechatthread" (
	"second_user_id"
);
CREATE INDEX IF NOT EXISTS "core_privatechatmessage_chat_thread_id_04140cfd" ON "core_privatechatmessage" (
	"chat_thread_id"
);
CREATE INDEX IF NOT EXISTS "core_privatechatmessage_sender_id_862963b8" ON "core_privatechatmessage" (
	"sender_id"
);
CREATE INDEX IF NOT EXISTS "core_groupchatmessage_gc_thread_id_ca4dccea" ON "core_groupchatmessage" (
	"gc_thread_id"
);
CREATE INDEX IF NOT EXISTS "core_groupchatmessage_sender_id_217dcde1" ON "core_groupchatmessage" (
	"sender_id"
);
COMMIT;
