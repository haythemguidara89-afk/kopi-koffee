// Kopi Koffee - Bilingual Internationalization Suite (French & Arabic)
// Real-time language switching with RTL support, Cairo Arabic typography, and persistent preference.

const KOPI_I18N = {
    currentLang: localStorage.getItem('kopiLang') || 'fr',

    translations: {
        fr: {
            // General / Brand
            store_status: "Ouvert • Service à table",
            brand_subtitle: "Food & Drink • Café Lounge",
            currency: "DT",

            // Table Strip & Modal
            table_service: "Service à table",
            table_not_set: "Table non renseignée • Toucher ici pour choisir",
            table_choose_btn: "Choisir ma table",
            table_change_btn: "Changer de table",
            table_selected_prefix: "Table",
            modal_table_title: "Numéro de votre Table",
            modal_table_desc: "Indiquez votre table pour que l'équipe vous serve directement",
            modal_table_confirm: "Confirmer la Table",
            modal_table_cancel: "Annuler",
            modal_table_quick: "Tables Rapides :",

            // Category Navigation & Toolbar
            all_categories: "Toutes les Catégories",
            back_to_categories: "Revenir aux Catégories",
            all_items: "Tout",
            items_count_suffix: "articles",
            search_placeholder: "Rechercher un café, une crêpe, un smoothie, un burger...",
            search_empty_title: "Aucun résultat pour votre recherche",
            search_empty_desc: "Essayez un autre mot-clé ou parcourez nos catégories.",
            add_to_cart: "Ajouter",
            added_to_cart: "Ajouté !",

            // Cart Drawer
            cart_title: "Votre Commande",
            cart_empty: "Votre panier est vide",
            cart_empty_desc: "Parcourez notre carte et ajoutez vos délices préférés.",
            serve_to_table: "Servir à la Table",
            table_not_specified: "Non renseigné",
            table_number_prefix: "Table N°",
            table_number_placeholder: "ex: 4",
            order_notes_label: "Instructions particulières pour la cuisine (Optionnel) :",
            order_notes_placeholder: "Ex: Café sans sucre, crêpe bien dorée, eau gazeuse fraîche...",
            total_to_pay: "Total à payer :",
            checkout_btn: "Confirmer et Envoyer la Commande",
            floating_cart_label: "Total de votre commande",
            floating_cart_btn: "Voir ma commande",

            // Order Status Modal
            order_received_title: "Commande Bien Reçue",
            order_transmitted: "Votre commande a été transmise en cuisine et au barista.",
            step_received: "Reçue",
            step_kitchen: "En Cuisine",
            step_served: "Servie",
            order_team_note: "Notre équipe vous apporte votre commande dès qu'elle est prête à votre table. Bon appétit !",
            continue_menu: "Continuer sur le Menu",

            // Footer
            footer_brand: "KOPI KOFFEE • FOOD & DRINK",
            footer_desc: "Service à table raffiné • Produits frais préparés à la commande",

            // Admin Screen
            admin_auth_title: "Espace Administration",
            admin_auth_subtitle: "Système Cuisine & Comptoir KDS • Kopi Koffee",
            admin_auth_desc: "Veuillez entrer votre mot de passe pour accéder à la cuisine",
            passkey_login_btn: "Connexion Passkey (Face ID / Empreinte)",
            passkey_or_pin: "OU AVEC LE CODE PIN",
            passkey_recovery_toggle: "Utiliser un code de secours",
            passkey_recovery_placeholder: "Code de secours (ex: KP-849201)",
            passkey_recovery_btn: "Valider le code de secours",
            passkey_modal_invite_title: "Activer votre Passkey d'accès",
            passkey_modal_invite_desc: "Liez cet appareil à votre profil administrateur pour vous connecter en 1 clic via Face ID ou votre empreinte.",
            passkey_register_now: "Activer mon Passkey sur cet appareil",
            passkey_manage_nav_btn: "Sécurité & Passkeys",
            passkey_manage_modal_title: "Gestion des Passkeys & Liens Staff",
            passkey_manage_modal_desc: "Générez des liens à usage unique et gérez les clés biométriques autorisées",
            passkey_create_invite_btn: "Générer un lien d'activation",
            passkey_staff_name_label: "Nom du membre du staff :",
            passkey_staff_name_placeholder: "ex: Ahmed - Chef Barista",
            passkey_copy_link: "Copier le lien d'activation",
            passkey_link_copied: "Lien copié dans le presse-papiers !",
            passkey_active_list_title: "Appareils & Passkeys Enregistrés",
            passkey_no_passkeys: "Aucun Passkey enregistré pour le moment.",
            passkey_revoke: "Révoquer",
            passkey_revoked_success: "Passkey révoqué avec succès !",
            passkey_success_login: "Connexion biométrique réussie !",
            passkey_registered_success: "Passkey activé avec succès !",
            passkey_welcome_team: "Bienvenue dans l'équipe d'administration",
            passkey_invite_prompt: "Cliquez ci-dessous pour enregistrer votre appareil (Face ID, Empreinte tactile ou Windows Hello). Ce lien d'invitation est à usage unique et sera désactivé après cette configuration.",
            passkey_success_title: "Passkey Enregistré avec Succès !",
            passkey_success_desc: "Votre Passkey est maintenant actif. Conservez précieusement ce code de secours en cas de perte de votre appareil :",
            passkey_enter_kds: "Accéder à l'écran de cuisine",
            passkey_create_invite_title: "Créer un lien d'invitation à usage unique",
            passkey_create_invite_desc: "Générez un lien direct permettant à un membre du personnel d'enregistrer son empreinte ou Face ID sur son appareil.",
            passkey_btn_generate: "Générer le lien",
            passkey_copy_link_short: "Copier",
            passkey_invite_notice: "Lien valide 48 heures. Il sera invalidé immédiatement après sa première utilisation.",
            passkey_col_admin: "Membre / Rôle",
            passkey_col_created: "Créé le",
            passkey_col_last_used: "Dernière utilisation",
            passkey_col_recovery: "Code de secours",
            passkey_col_actions: "Action",
            passkey_confirm_revoke: "Êtes-vous sûr de vouloir révoquer ce Passkey ?",
            passkey_no_biometrics: "Votre appareil ne supporte pas l'authentification biométrique WebAuthn.",
            admin_back_client: "Retour au Menu Client",
            admin_kds_title: "Kopi Koffee",
            admin_kds_badge: "Cuisine KDS",
            admin_kds_sub: "Gestion & Affichage des commandes en temps réel",
            admin_live: "En direct",
            admin_fullscreen: "Plein Écran",
            admin_minimize: "Réduire",
            admin_sound_on: "Son Activé",
            admin_sound_off: "Son Coupé",
            admin_client_space: "Menu Client",
            admin_lock: "Déconnexion",
            admin_toast_logged_out: "Session déconnectée avec succès",
            admin_metric_pending: "Commandes en attente",
            admin_metric_prep: "En préparation active",
            admin_metric_revenue: "Recette totale du jour",
            admin_metric_items: "Total articles préparés",
            admin_search_placeholder: "Rechercher table (ex: 5) ou commande...",
            admin_filter_all: "Toutes",
            admin_filter_pending: "En attente",
            admin_filter_prep: "En préparation",
            admin_filter_completed: "Servies",
            admin_refresh: "Actualiser",
            admin_reset: "Réinitialiser",
            admin_btn_prep: "Préparer",
            admin_btn_ready: "Marquer Servi",
            admin_btn_print: "Ticket",
            admin_btn_archive: "Archiver",
            admin_client_note: "Instruction client :",
            admin_order_total: "Total Commande :",
            // Category Hub & Search
            hub_title: "Carte des Délices Kopi Koffee",
            hub_subtitle: "Appuyez simplement sur une catégorie pour afficher nos cafés, délices et formules préparés à la commande",
            browse_menu: "Consulter la carte",
            delights_count: "délices au menu",
            items_count: "articles",
            results_for: "Résultats pour",
            no_products: "Aucun produit trouvé",
            no_products_desc: "Aucun article ne correspond à votre recherche. Essayez avec un autre mot ou parcourez nos catégories.",
            empty_subcat: "Aucun produit dans cette sous-catégorie",
            added: "Ajouté",
            alert_choose_table: "Veuillez sélectionner ou indiquer le numéro de votre table.",
            alert_empty_cart: "Votre panier est vide !",
            toast_table_selected: "Table {num} sélectionnée",
            toast_item_added: "ajouté au panier",
            status_desc_pending: "Votre commande est bien reçue par le comptoir et attend la préparation.",
            status_desc_prep: "Notre barista & cuisine préparent actuellement vos délices fraîchement !",
            status_desc_ready: "Votre commande est prête et servie à votre table ! Bon appétit !",
            status_badge_pending: "En attente",
            status_badge_prep: "En préparation",
            status_badge_ready: "Servie",
            admin_confirm_archive: "Voulez-vous archiver cette commande de la liste ?",
            admin_confirm_reset: "Attention : Voulez-vous vraiment effacer l'historique complet des commandes d'aujourd'hui ?",
            admin_pin_error: "Code PIN incorrect. Veuillez réessayer.",
            admin_auth_success: "Accès autorisé • Bienvenue en cuisine",
            admin_order_notif: "Nouvelle commande reçue en cuisine !",
            admin_order_card_table: "TABLE",

            // Receipt
            receipt_title: "KOPI KOFFEE",
            receipt_sub: "Food & Drink • Café Lounge",
            receipt_type: "Ticket de Commande Cuisine",
            receipt_table: "TABLE:",
            receipt_order: "Commande:",
            receipt_date: "Date/Heure:",
            receipt_note: "NOTE:",
            receipt_total: "TOTAL:",
            receipt_thanks: "Merci de votre fidélité !",

            // Daily Summary & Extraction
            admin_daily_title: "Rapport de Clôture Journalier",
            admin_daily_subtitle: "Récapitulatif des commandes servies & chiffre d'affaires du jour",
            admin_served_orders_title: "Commandes Servies Aujourd'hui",
            admin_served_orders_desc: "Toutes les commandes ayant été préparées et servies aux tables.",
            admin_metric_served_count: "Commandes Servies",
            admin_metric_avg_basket: "Panier Moyen",
            admin_btn_extract_csv: "Exporter CSV (Excel)",
            admin_btn_print_zreport: "Imprimer Rapport Z",
            admin_btn_copy_summary: "Copier le Résumé",
            admin_no_served_orders: "Aucune commande servie aujourd'hui pour le moment.",
            admin_articles_sold: "Articles Préparés & Vendus",
            admin_order_time: "Heure",
            admin_order_table: "Table",
            admin_order_items: "Articles",
            admin_order_amount: "Montant",
            admin_click_to_extract: "Cliquer pour voir et extraire",

            // Archives
            admin_archives_title: "Historique des Commandes Archivées",
            admin_archives_subtitle: "Retrouvez toutes les commandes passées avec dates, heures et détails",
            admin_btn_archives: "Archives",
            admin_btn_restore: "Restaurer",
            admin_archived_at: "Archivée à",
            admin_created_at: "Créée le",
            admin_no_archives: "Aucune commande dans les archives pour le moment.",
            admin_search_archives: "Rechercher dans les archives (table, ID, article)...",
            admin_confirm_restore: "Voulez-vous restaurer cette commande vers l'écran de cuisine actif ?",
            admin_toast_restored: "Commande restaurée en cuisine !",
            admin_toast_summary_copied: "Résumé copié dans le presse-papiers !"
        },

        ar: {
            // General / Brand
            store_status: "مفتوح • خدمة على الطاولة",
            brand_subtitle: "مأكولات و مشروبات • كافيه لاونج",
            currency: "د.ت",

            // Table Strip & Modal
            table_service: "خدمة على الطاولة",
            table_not_set: "لم يتم تحديد الطاولة • اضغط هنا للاختيار",
            table_choose_btn: "اختر طاولتك",
            table_change_btn: "تغيير الطاولة",
            table_selected_prefix: "طاولة",
            modal_table_title: "رقم طاولتك",
            modal_table_desc: "حدد رقم طاولتك ليقوم فريقنا بخدمتك مباشرة",
            modal_table_confirm: "تأكيد الطاولة",
            modal_table_cancel: "إلغاء",
            modal_table_quick: "طاولات سريعة :",

            // Category Navigation & Toolbar
            all_categories: "جميع الأقسام",
            back_to_categories: "الرجوع للأقسام",
            all_items: "الكل",
            items_count_suffix: "منتج",
            search_placeholder: "ابحث عن قهوة، كريب، عصير، برغر، موهيتو...",
            search_empty_title: "لم يتم العثور على نتائج",
            search_empty_desc: "جرب كلمة بحث أخرى أو تصفح الأقسام أدناه.",
            add_to_cart: "إضافة",
            added_to_cart: "تمت الإضافة !",

            // Cart Drawer
            cart_title: "طلبك",
            cart_empty: "سلة الطلبات فارغة",
            cart_empty_desc: "تصفح القائمة واختر مشروباتك وأطباقك المفضلة.",
            serve_to_table: "تقديم إلى الطاولة",
            table_not_specified: "غير محدد",
            table_number_prefix: "طاولة رقم",
            table_number_placeholder: "مثال: 4",
            order_notes_label: "ملاحظات خاصة للمطبخ (اختياري) :",
            order_notes_placeholder: "مثال: قهوة بدون سكر، كريب محمر جيداً، ماء بارد...",
            total_to_pay: "المجموع للدفع :",
            checkout_btn: "تأكيد وإرسال الطلب",
            floating_cart_label: "مجموع طلبك",
            floating_cart_btn: "عرض الطلب",

            // Order Status Modal
            order_received_title: "تم استلام الطلب بنجاح",
            order_transmitted: "تم إرسال طلبك إلى المطبخ والباريستا مباشرة.",
            step_received: "تم الاستلام",
            step_kitchen: "في المطبخ",
            step_served: "تم التقديم",
            order_team_note: "سيحضر فريقنا طلبك إلى طاولتك فور جهوزه. شهية طيبة !",
            continue_menu: "مواصلة تصفح القائمة",

            // Category Hub & Search
            hub_title: "قائمة أطايب و مأكولات كوبي كوفي",
            hub_subtitle: "اضغط على أي قسم لعرض القهوة، المشروبات والأطباق المحضرة طازجة عند الطلب",
            browse_menu: "تصفح القائمة",
            delights_count: "عنصر في القائمة",
            items_count: "عنصر",
            results_for: "نتائج البحث عن",
            no_products: "لم يتم العثور على أي منتج",
            no_products_desc: "لا يوجد عنصر يطابق بحثك. جرب كلمة أخرى أو تصفح الأقسام أدناه.",
            empty_subcat: "لا توجد منتجات في هذا القسم الفرعي",
            added: "تمت الإضافة",
            alert_choose_table: "يرجى تحديد أو كتابة رقم طاولتك من فضلك.",
            alert_empty_cart: "سلة الطلبات فارغة !",
            toast_table_selected: "تم اختيار طاولة {num}",
            toast_item_added: "أضيف إلى الطلب",
            status_desc_pending: "تم استلام طلبك في المطبخ وهو في انتظار التحضير.",
            status_desc_prep: "يقوم الباريستا والمطبخ الآن بتحضير طلبك بكل عناية !",
            status_desc_ready: "طلبك جاهز وتم تقديمه على طاولتك ! شهية طيبة !",
            status_badge_pending: "في الانتظار",
            status_badge_prep: "قيد التحضير",
            status_badge_ready: "تم التقديم",
            admin_confirm_archive: "هل تريد أرشفة هذا الطلب من القائمة ؟",
            admin_confirm_reset: "تنبيه : هل تريد حقاً مسح سجل الطلبات بالكامل لهذا اليوم ؟",
            admin_pin_error: "رمز PIN غير صحيح. يرجى إعادة المحاولة.",
            admin_auth_success: "تم السماح بالدخول • مرحباً بكم في المطبخ",
            admin_order_notif: "وصل طلب جديد إلى المطبخ !",
            admin_order_card_table: "طاولة",
            // General / Brand
            store_status: "مفتوح • خدمة على الطاولة",
            brand_subtitle: "مأكولات و مشروبات • كافيه لاونج",
            currency: "د.ت",

            // Table Strip & Modal
            table_service: "خدمة على الطاولة",
            table_not_set: "لم يتم تحديد الطاولة • اضغط هنا للاختيار",
            table_choose_btn: "اختر طاولتك",
            table_change_btn: "تغيير الطاولة",
            table_selected_prefix: "طاولة",
            modal_table_title: "رقم طاولتك",
            modal_table_desc: "حدد رقم طاولتك ليقوم فريقنا بخدمتك مباشرة",
            modal_table_confirm: "تأكيد الطاولة",
            modal_table_cancel: "إلغاء",
            modal_table_quick: "طاولات سريعة :",

            // Category Navigation & Toolbar
            all_categories: "جميع الأقسام",
            back_to_categories: "الرجوع للأقسام",
            all_items: "الكل",
            items_count_suffix: "منتج",
            search_placeholder: "ابحث عن قهوة، كريب، عصير، برغر، موهيتو...",
            search_empty_title: "لم يتم العثور على نتائج",
            search_empty_desc: "جرب كلمة بحث أخرى أو تصفح الأقسام أدناه.",
            add_to_cart: "إضافة",
            added_to_cart: "تمت الإضافة !",

            // Cart Drawer
            cart_title: "طلبك",
            cart_empty: "سلة الطلبات فارغة",
            cart_empty_desc: "تصفح القائمة واختر مشروباتك وأطباقك المفضلة.",
            serve_to_table: "تقديم إلى الطاولة",
            table_not_specified: "غير محدد",
            table_number_prefix: "طاولة رقم",
            table_number_placeholder: "مثال: 4",
            order_notes_label: "ملاحظات خاصة للمطبخ (اختياري) :",
            order_notes_placeholder: "مثال: قهوة بدون سكر، كريب محمر جيداً، ماء بارد...",
            total_to_pay: "المجموع للدفع :",
            checkout_btn: "تأكيد وإرسال الطلب",
            floating_cart_label: "مجموع طلبك",
            floating_cart_btn: "عرض الطلب",

            // Order Status Modal
            order_received_title: "تم استلام الطلب بنجاح",
            order_transmitted: "تم إرسال طلبك إلى المطبخ والباريستا مباشرة.",
            step_received: "تم الاستلام",
            step_kitchen: "في المطبخ",
            step_served: "تم التقديم",
            order_team_note: "سيحضر فريقنا طلبك إلى طاولتك فور جهوزه. شهية طيبة !",
            continue_menu: "مواصلة تصفح القائمة",

            // Footer
            footer_brand: "كوبي كوفي • KOPI KOFFEE",
            footer_desc: "خدمة راقية على الطاولة • منتجات طازجة تحضر عند الطلب",

            // Admin Screen
            admin_auth_title: "لوحة الإدارة و المطبخ",
            admin_auth_subtitle: "نظام شاشة المطبخ KDS • كوبي كوفي",
            admin_auth_desc: "الرجاء إدخال الرمز السري للدخول إلى المطبخ",
            passkey_login_btn: "تسجيل الدخول عبر البصمة / Face ID",
            passkey_or_pin: "أو عبر الرمز السري",
            passkey_recovery_toggle: "استخدام رمز الأمان البديل",
            passkey_recovery_placeholder: "رمز الأمان (مثال: KP-849201)",
            passkey_recovery_btn: "تأكيد رمز الأمان",
            passkey_modal_invite_title: "تفعيل مفتاح المرور السريع",
            passkey_modal_invite_desc: "اربط هذا الجهاز بملفك الإداري لتسجيل الدخول بلمسة واحدة عبر بصمة الوجه أو الأصبع.",
            passkey_register_now: "تفعيل مفتاح المرور على هذا الجهاز",
            passkey_manage_nav_btn: "الأمان ومفاتيح المرور",
            passkey_manage_modal_title: "إدارة مفاتيح المرور ودعوات الموظفين",
            passkey_manage_modal_desc: "إنشاء روابط لمرة واحدة وإدارة الأجهزة البيومترية المعتمدة",
            passkey_create_invite_btn: "إنشاء رابط تفعيل",
            passkey_staff_name_label: "اسم الموظف أو المدير :",
            passkey_staff_name_placeholder: "مثال: أحمد - باريستا أول",
            passkey_copy_link: "نسخ رابط التفعيل",
            passkey_link_copied: "تم نسخ الرابط بنجاح !",
            passkey_active_list_title: "الأجهزة ومفاتيح المرور المسجلة",
            passkey_no_passkeys: "لا توجد مفاتيح مرور مسجلة حالياً.",
            passkey_revoke: "إلغاء الصلاحية",
            passkey_revoked_success: "تم إلغاء مفتاح المرور بنجاح !",
            passkey_success_login: "تم تسجيل الدخول بالبصمة بنجاح !",
            passkey_registered_success: "تم تفعيل مفتاح المرور بنجاح !",
            passkey_welcome_team: "مرحباً بك في فريق الإدارة",
            passkey_invite_prompt: "اضغط أدناه لتسجيل جهازك (بصمة الوجه، بصمة الإصبع أو Windows Hello). هذا الرابط صالح لمرة واحدة وسيتم تعطيله بعد هذا الإعداد.",
            passkey_success_title: "تم تسجيل مفتاح المرور بنجاح !",
            passkey_success_desc: "مفتاح المرور الخاص بك نشط الآن. احتفظ برمز الأمان هذا في مكان آمن في حال فقدان جهازك :",
            passkey_enter_kds: "الدخول إلى شاشة المطبخ",
            passkey_create_invite_title: "إنشاء رابط دعوة لمرة واحدة",
            passkey_create_invite_desc: "أنشئ رابطاً مباشراً يمكن موظفيك من تسجيل بصمتهم على أجهزتهم الخاصة.",
            passkey_btn_generate: "إنشاء الرابط",
            passkey_copy_link_short: "نسخ",
            passkey_invite_notice: "الرابط صالح لمدة 48 ساعة. سيتم إبطاله تلقائياً بمجرد استخدامه لأول مرة.",
            passkey_col_admin: "الموظف / الدور",
            passkey_col_created: "تاريخ الإنشاء",
            passkey_col_last_used: "آخر استخدام",
            passkey_col_recovery: "رمز الأمان",
            passkey_col_actions: "الإجراء",
            passkey_confirm_revoke: "هل أنت متأكد من رغبتك في إلغاء مفتاح المرور هذا ؟",
            passkey_no_biometrics: "جهازك لا يدعم المصادقة البيومترية WebAuthn.",
            admin_back_client: "الرجوع لقائمة الحرفاء",
            admin_kds_title: "كوبي كوفي",
            admin_kds_badge: "شاشة المطبخ",
            admin_kds_sub: "إدارة ومتابعة الطلبات في الوقت الفعلي",
            admin_live: "مباشر",
            admin_fullscreen: "ملء الشاشة",
            admin_minimize: "تصغير",
            admin_sound_on: "الصوت مفعل",
            admin_sound_off: "الصوت صامت",
            admin_client_space: "قائمة الحرفاء",
            admin_lock: "تسجيل الخروج",
            admin_toast_logged_out: "تم تسجيل الخروج بنجاح",
            admin_metric_pending: "طلبات في الانتظار",
            admin_metric_prep: "قيد التحضير",
            admin_metric_revenue: "المداخيل الإجمالية لليوم",
            admin_metric_items: "إجمالي المنتجات المحضرة",
            admin_search_placeholder: "ابحث عن رقم الطاولة أو رقم الطلب...",
            admin_filter_all: "الكل",
            admin_filter_pending: "في الانتظار",
            admin_filter_prep: "قيد التحضير",
            admin_filter_completed: "تم التقديم",
            admin_refresh: "تحديث",
            admin_reset: "إعادة تعيين",
            admin_btn_prep: "بدء التحضير",
            admin_btn_ready: "تم التقديم",
            admin_btn_print: "طباعة وصل",
            admin_btn_archive: "أرشفة",
            admin_client_note: "ملاحظة الحريف :",
            admin_order_total: "مجموع الطلب :",
            admin_no_orders: "لا توجد طلبات في هذا القسم",
            admin_no_orders_desc: "تم تحضير جميع الطلبات أو أن القائمة فارغة حالياً.",

            // Receipt
            receipt_title: "كوبي كوفي - KOPI KOFFEE",
            receipt_sub: "Food & Drink • Café Lounge",
            receipt_type: "وصل طلب المطبخ",
            receipt_table: "الطاولة:",
            receipt_order: "الطلب:",
            receipt_date: "التاريخ/الوقت:",
            receipt_note: "ملاحظة:",
            receipt_total: "المجموع:",
            receipt_thanks: "شكراً لزيارتكم الكريمة !",

            // Daily Summary & Extraction
            admin_daily_title: "تقرير نهاية اليوم والطلبات المقدمة",
            admin_daily_subtitle: "ملخص المبيعات، الطلبات المنجزة والمداخيل اليومية",
            admin_served_orders_title: "الطلبات التي تم تقديمها اليوم",
            admin_served_orders_desc: "جميع الطلبات التي تم تحضيرها وتقديمها على الطاولات.",
            admin_metric_served_count: "طلبات تم تقديمها",
            admin_metric_avg_basket: "معدل الطلب الواحد",
            admin_btn_extract_csv: "تحميل ملف إكسل (CSV)",
            admin_btn_print_zreport: "طباعة تقرير الإغلاق (Z)",
            admin_btn_copy_summary: "نسخ الملخص",
            admin_no_served_orders: "لم يتم تقديم أي طلب بعد اليوم.",
            admin_articles_sold: "المنتجات المحضرة والمباعة",
            admin_order_time: "الوقت",
            admin_order_table: "الطاولة",
            admin_order_items: "المحتويات",
            admin_order_amount: "المبلغ",
            admin_click_to_extract: "اضغط للمعاينة والاستخراج",

            // Archives
            admin_archives_title: "سجل الطلبات المؤرشفة",
            admin_archives_subtitle: "عرض جميع الطلبات السابقة مع التاريخ والوقت والتفاصيل الكاملة",
            admin_btn_archives: "الأرشيف",
            admin_btn_restore: "استرجاع للمطبخ",
            admin_archived_at: "أرشفت في",
            admin_created_at: "أُنشئت في",
            admin_no_archives: "لا توجد طلبات مؤرشفة حالياً.",
            admin_search_archives: "بحث في الأرشيف (رقم الطاولة، رقم الطلب، المنتج)...",
            admin_confirm_restore: "هل تريد استرجاع هذا الطلب إلى شاشة المطبخ النشطة ؟",
            admin_toast_restored: "تمت استعادة الطلب إلى شاشة المطبخ !",
            admin_toast_summary_copied: "تم نسخ ملخص اليوم بنجاح !"
        }
    },

    // Category translations mapping
    categories: {
        // Main Groups
        "categories": {
            name: { fr: "Toutes les Catégories", ar: "جميع الأقسام" },
            desc: { fr: "Consultez toutes nos spécialités", ar: "تصفح جميع أقسام القائمة" }
        },
        "petit-dejeuner": {
            name: { fr: "Petit Déjeuner & Brunch", ar: "فطور الصباح و برانش" },
            desc: { fr: "Formules complètes, viennoiseries dorées, œufs & délices matinaux", ar: "وجبات فطور كاملة، حلويات صباحية، بيض وأطباق إفطار شهية" }
        },
        "cafes-chauds-groupe": {
            name: { fr: "Cafés & Boissons Chaudes", ar: "قهوة و مشروبات ساخنة" },
            desc: { fr: "Espressos d'exception, cafés frappés & glacés, thés fins & chocolat chaud", ar: "إسبريسو مختص، قهوة مثلجة، شاي فاخر وشوكولاتة ساخنة" }
        },
        "jus-boissons": {
            name: { fr: "Jus & Boissons Fraîches", ar: "عصائر و مشروبات منعشة" },
            desc: { fr: "Jus d'oranges pressés à la minute, cocktails vitaminés, thés glacés & sodas", ar: "عصائر طازجة، كوكتيلات فواكه، شاي مثلج ومشروبات غازية" }
        },
        "shakes-mojitos": {
            name: { fr: "Smoothies, Shakes & Mojitos", ar: "سموذي، مخفوقات و موهيتو" },
            desc: { fr: "Milkshakes onctueux, smoothies 100% fruits, mojitos rafraîchissants", ar: "ميلك شيك كريمي، سموذي فواكه طبيعية، موهيتو منعش" }
        },
        "crepes-gaufres": {
            name: { fr: "Crêpes, Gaufres & Pancakes", ar: "كريب، وافل و بانكيك" },
            desc: { fr: "Crêpes salées gourmandes, crêpes sucrées, gaufres liégeoises & pancakes", ar: "كريب مالح وحلو، وافل بلجيكي وبانكيك أمريكي" }
        },
        "sale-restauration": {
            name: { fr: "Salé & Restauration", ar: "مملحات و وجبات خفيفة" },
            desc: { fr: "Paninis croustillants, burgers gourmets au bœuf ou poulet, omelettes maison", ar: "بانيني مقرمش، برغر شهي، وأومليت محضر في الحين" }
        },
        "desserts-glaces": {
            name: { fr: "Desserts & Glaces", ar: "حلويات و مثلجات" },
            desc: { fr: "Pâtisseries artisanales, cheesecakes, moelleux & coupes glacées parfumées", ar: "تشيز كيك، كيك الشوكولاتة، وآيس كريم مشكل" }
        },
        "chicha-groupe": {
            name: { fr: "Espace Chicha", ar: "فضاء الشيشة" },
            desc: { fr: "Chicha classique et chicha fraîcheur au glaçon, parfums variés", ar: "شيشة عادية وشيشة مثلجة بنكهات متنوعة" }
        },

        // Subcategories
        "all": { fr: "Tout", ar: "الكل" },
        "cafes-chauds": { fr: "Cafés Chauds", ar: "قهوة ساخنة" },
        "cafes-frappes": { fr: "Cafés Frappés", ar: "قهوة فرابي" },
        "cafes-glaces": { fr: "Cafés Glacés", ar: "قهوة مثلجة" },
        "thes": { fr: "Thés & Infusions", ar: "شاي و أعشاب" },
        "chocolat-chaud": { fr: "Chocolat Chaud", ar: "شوكولاتة ساخنة" },
        "jus": { fr: "Jus Frais Pressés", ar: "عصائر طازجة" },
        "cocktails": { fr: "Cocktails de Fruits", ar: "كوكتيل فواكه" },
        "thes-glaces": { fr: "Thés Glacés", ar: "شاي مثلج" },
        "boissons": { fr: "Eaux & Sodas", ar: "مياه و مشروبات" },
        "smoothies": { fr: "Smoothies Pur Fruit", ar: "سموذي طبيعي" },
        "milkshakes": { fr: "Milk-shakes Gourmands", ar: "ميلك شيك" },
        "mojitos": { fr: "Mojitos Frais", ar: "موهيتو طازج" },
        "soft-cocktails": { fr: "Soft Cocktails", ar: "كوكتيل منعش" },
        "crepes-salees": { fr: "Crêpes Salées", ar: "كريب مالح" },
        "crepes-sucrees": { fr: "Crêpes Sucrées", ar: "كريب حلو" },
        "gaufres": { fr: "Gaufres Liégeoises", ar: "وافل" },
        "pancakes": { fr: "Pancakes Américains", ar: "بانكيك" },
        "paninis": { fr: "Paninis Croustillants", ar: "بانيني" },
        "hamburgers": { fr: "Burgers Gourmets", ar: "برغر" },
        "omelettes": { fr: "Omelettes Maison", ar: "أومليت" },
        "desserts": { fr: "Pâtisseries & Glaces", ar: "حلويات و مثلجات" },
        "chicha": { fr: "Chicha & Chicha Glaçon", ar: "شيشة عادية و مثلجة" }
    },

    // Common item names translation mapping for instant recognition
    itemDictionary: {
        "Espresso Intenso": "إسبريسو إنتنسو",
        "Espresso Macchiato": "إسبريسو ماكياتو",
        "Café Crème": "قهوة بالحليب",
        "Cappuccino Italien": "كابتشينو إيطالي",
        "Café Américain": "قهوة أمريكانو",
        "Café Turc": "قهوة تركية",
        "Café Viennois": "قهوة فيينواز",
        "Latte Macchiato": "لاتيه ماكياتو",
        "Mocaccino": "موكاشينو",
        "Chocolat Chaud Gourmand": "شوكولاتة ساخنة فاخرة",
        "Thé à la Menthe": "شاي بالنعناع",
        "Thé Vert": "شاي أخضر",
        "Thé aux Amandes": "شاي باللوز",
        "Thé aux Pignons": "شاي بالبندق",
        "Jus d'Orange Frais": "عصير برتقال طازج",
        "Jus de Fraise": "عصير فراولة طازج",
        "Jus de Citron": "عصير ليمون طازج",
        "Citronnade Kopi": "ليموناضة كوبي الخاصة",
        "Cocktail Tutti Frutti": "كوكتيل توتي فروتي",
        "Mojito Virgin Classic": "موهيتو كلاسيك كحول مجاني",
        "Mojito Fraise": "موهيتو بالفراولة",
        "Smoothie Fraise Banane": "سموذي فراولة وموز",
        "Milkshake Nutella": "ميلك شيك نوتيلا",
        "Milkshake Vanille": "ميلك شيك فانيليا",
        "Milkshake Chocolat": "ميلك شيك شوكولاتة",
        "Crêpe Nutella": "كريب نوتيلا",
        "Crêpe Nutella Banane": "كريب نوتيلا وموز",
        "Crêpe Spéculoos": "كريب سبيكولوس",
        "Crêpe Thon Fromage": "كريب بالتونة والجبن",
        "Crêpe Poulet Fromage": "كريب بالدجاج والجبن",
        "Gaufre Nutella": "وافل بالنوتيلا",
        "Pancake Nutella": "بانكيك نوتيلا",
        "Panini Thon Fromage": "بانيني تونة وجبن",
        "Panini Poulet": "بانيني دجاج",
        "Burger Classic": "برغر كلاسيك",
        "Burger Cheese": "تشيز برغر",
        "Burger Double": "دبل برغر",
        "Omelette Nature": "أومليت سادة",
        "Omelette Fromage": "أومليت بالجبن",
        "Omelette Thon Fromage": "أومليت بالتونة والجبن",
        "Cheesecake": "تشيز كيك",
        "Tiramisu": "تيراميسو",
        "Fondant au Chocolat": "فوندان الشوكولاتة",
        "Chicha Pomme": "شيشة تفاحتين",
        "Chicha Menthe": "شيشة نعناع",
        "Chicha Raisin Menthe": "شيشة عنب ونعناع",
        "Chicha Glaçon": "شيشة مثلجة"
    },

    t(key) {
        const lang = this.currentLang;
        const dict = this.translations[lang] || this.translations['fr'];
        return dict[key] || this.translations['fr'][key] || key;
    },

    getCategoryName(id, defaultName) {
        const lang = this.currentLang;
        const cat = this.categories[id];
        if (cat) {
            if (typeof cat.name === 'object') return cat.name[lang] || cat.name['fr'];
            if (cat[lang]) return cat[lang];
        }
        return defaultName;
    },

    getCategoryDesc(id, defaultDesc) {
        const lang = this.currentLang;
        const cat = this.categories[id];
        if (cat && cat.desc) {
            return cat.desc[lang] || cat.desc['fr'];
        }
        return defaultDesc;
    },

    getItemName(item) {
        if (this.currentLang === 'ar') {
            if (item.name_ar) return item.name_ar;
            if (this.itemDictionary[item.name]) return this.itemDictionary[item.name];
        }
        return item.name;
    },

    getItemDesc(item) {
        if (this.currentLang === 'ar') {
            if (item.desc_ar) return item.desc_ar;
        }
        return item.desc;
    },

    setLang(lang) {
        if (lang !== 'fr' && lang !== 'ar') lang = 'fr';
        this.currentLang = lang;
        localStorage.setItem('kopiLang', lang);

        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

        if (lang === 'ar') {
            document.body.classList.add('rtl-mode');
        } else {
            document.body.classList.remove('rtl-mode');
        }

        // Update active class on all language buttons across DOM
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Dispatch global language change event for active apps
        window.dispatchEvent(new CustomEvent('kopiLangChanged', { detail: { lang } }));
    },

    init() {
        this.setLang(this.currentLang);
    }
};

// Auto-initialize when script loads
KOPI_I18N.init();
