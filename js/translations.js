// ===========================
// ПЕРЕВОДЫ ДЛЯ МУЛЬТИЯЗЫЧНОСТИ
// ===========================

// Структура готова для добавления переводов
// Клиент должен заполнить переводы для русского и английского языков

const translations = {
    lt: {
        // НАВИГАЦИЯ
        nav_home: 'Pagrindinis',
        nav_services: 'Paslaugos',
        nav_gallery: 'Galerija',
        nav_contacts: 'Kontaktai',
        nav_about: 'Apie mus',
        
        // ГЛАВНАЯ СТРАНИЦА
        hero_title: 'Mafija žaidimas pagal Oleg Čeklu formatą',
        hero_subtitle: 'Profesionalus mafijos žaidimo organizavimas renginių įvairiose vietose Vilniuje ir už jo ribų',
        hero_cta: 'Skaičiuoti kainą',
        
        services_title: 'Mūsų paslaugos',
        service1_title: 'Žaidimo organizavimas',
        service1_desc: 'Profesionalus mafijos žaidimo vedimas su visa reikalinga atributika ir patyrusiais vedėjais',
        service2_title: 'Renginio organizavimas',
        service2_desc: 'Pilnas renginio organizavimas su vietos paieška, dekoravimu, fotografija ir mafijos žaidimu',
        service3_title: 'Atributikos nuoma',
        service3_desc: 'Nuomojame visą reikalingą atributiką mafijos žaidimui jūsų renginiui',
        
        btn_more: 'Plačiau',
        btn_from: 'Nuo',
        
        cta_title: 'Organizuokite nepamirštamą renginį',
        cta_desc: 'Paskaičiuokite savo renginio kainą per kelias minutes',
        cta_button: 'Eiti į kainų skaičiuoklę',
        
        // КАЛЬКУЛЯТОР
        calc_title: 'Kainų skaičiuoklė',
        calc_package: 'Pasirinkite paketą',
        calc_date: 'Pasirinkite datą',
        calc_guests: 'Svečių skaičius',
        calc_location: 'Lokacija',
        calc_location_vilnius: 'Vilnius',
        calc_location_outside: 'Už Vilniaus ribų',
        calc_distance: 'Atstumas nuo Vilniaus',
        calc_additional: 'Papildomos paslaugos',
        calc_calculate: 'Paskaičiuoti',
        calc_reserve: 'Rezervuoti',
        calc_total: 'Bendra suma',
        
        // КОНТАКТЫ
        contact_form_title: 'Susisiekite su mumis',
        contact_name: 'Jūsų vardas',
        contact_email: 'El. paštas',
        contact_message: 'Žinutė',
        contact_send: 'Siųsti',
        
        contact_info_title: 'Kontaktinė informacija',
        contact_coordinator: 'Klubo koordinatorius',
        contact_founder: 'Klubo įkūrėjas',
        
        faq_title: 'Dažnai užduodami klausimai',
        
        // FOOTER
        footer_about: 'Profesionalus mafijos žaidimo organizavimas nuo 2009 metų',
        footer_navigation: 'Navigacija',
        footer_contacts: 'Kontaktai',
        footer_follow: 'Sekite mus',
        footer_rights: 'Visos teisės saugomos',
    },
    
    ru: {
        // НАВИГАЦИЯ
        nav_home: 'Главная',
        nav_services: 'Услуги',
        nav_gallery: 'Галерея',
        nav_contacts: 'Контакты',
        nav_about: 'О нас',
        
        // ГЛАВНАЯ СТРАНИЦА - КЛИЕНТ ДОЛЖЕН ЗАПОЛНИТЬ
        hero_title: '[RU] Mafija žaidimas pagal Oleg Čeklu formatą',
        hero_subtitle: '[RU] Profesionalus mafijos žaidimo organizavimas...',
        // ... и так далее
    },
    
    en: {
        // NAVIGATION
        nav_home: 'Home',
        nav_services: 'Services',
        nav_gallery: 'Gallery',
        nav_contacts: 'Contacts',
        nav_about: 'About Us',
        
        // HOME PAGE - CLIENT SHOULD FILL IN
        hero_title: '[EN] Mafija game by Oleg Čeklu format',
        hero_subtitle: '[EN] Professional mafia game organization...',
        // ... and so on
    }
};

// Функция для получения перевода
function getTranslation(key, lang = 'lt') {
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    // Fallback на литовский, если перевод не найден
    return translations.lt[key] || key;
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, getTranslation };
}