export type ContactPreviewCopy = {
  notice: string;
  received: string;
  receivedHelp: string;
  restart: string;
  country: string;
  language: string;
};

export const CONTACT_PREVIEW_COPY: Record<string, ContactPreviewCopy> = {
  en: {
    notice: "This is a review preview. Submitting this form will not send an inquiry, email, DM or Telegram notification. Use sample information.",
    received: "Test submission complete",
    receivedHelp: "Nothing was sent or saved to the store. This example stays only on this screen and clears when you refresh.",
    restart: "Try another example",
    country: "Delivery country", language: "Language",
  },
  ko: {
    notice: "검토용 미리보기입니다. 이 양식을 제출해도 문의, 이메일, DM 또는 텔레그램 알림이 발송되지 않습니다. 예시 정보를 입력해 주세요.",
    received: "제출 테스트 완료",
    receivedHelp: "스토어에 전송되거나 저장된 내용은 없습니다. 이 예시는 현재 화면에만 표시되며 새로고침하면 사라집니다.",
    restart: "다른 예시로 다시 해보기",
    country: "배송 국가", language: "언어",
  },
  ja: {
    notice: "確認用プレビューです。このフォームを送信しても、お問い合わせ、メール、DM、Telegram通知は送信されません。サンプル情報を入力してください。",
    received: "送信テストが完了しました",
    receivedHelp: "ストアへの送信や保存は行われていません。この例は現在の画面にのみ表示され、再読み込みすると消えます。",
    restart: "別の例を試す",
    country: "配送先の国", language: "言語",
  },
  es: {
    notice: "Esta es una vista previa para revisión. Al enviar este formulario no se enviará ninguna consulta, correo electrónico, mensaje directo ni notificación de Telegram. Usa datos de ejemplo.",
    received: "Prueba de envío completada",
    receivedHelp: "No se ha enviado ni guardado nada en la tienda. Este ejemplo solo permanece en esta pantalla y se borra al actualizarla.",
    restart: "Probar otro ejemplo",
    country: "País de entrega", language: "Idioma",
  },
  th: {
    notice: "นี่คือหน้าตัวอย่างสำหรับตรวจสอบ การส่งแบบฟอร์มนี้จะไม่ส่งคำถาม อีเมล ข้อความส่วนตัว หรือการแจ้งเตือน Telegram กรุณาใช้ข้อมูลตัวอย่าง",
    received: "ทดสอบการส่งเรียบร้อยแล้ว",
    receivedHelp: "ไม่มีข้อมูลถูกส่งหรือบันทึกไปยังร้านค้า ตัวอย่างนี้แสดงเฉพาะบนหน้าจอนี้และจะหายไปเมื่อรีเฟรชหน้า",
    restart: "ลองตัวอย่างอื่น",
    country: "ประเทศปลายทาง", language: "ภาษา",
  },
  fr: {
    notice: "Ceci est un aperçu destiné à la vérification. L’envoi de ce formulaire n’enverra aucune demande, aucun e-mail, message privé ou notification Telegram. Utilisez des informations fictives.",
    received: "Test d’envoi terminé",
    receivedHelp: "Rien n’a été envoyé ni enregistré dans la boutique. Cet exemple reste uniquement sur cet écran et disparaît lorsque vous actualisez la page.",
    restart: "Essayer un autre exemple",
    country: "Pays de livraison", language: "Langue",
  },
  de: {
    notice: "Dies ist eine Vorschau zur Prüfung. Beim Absenden dieses Formulars werden keine Anfrage, E-Mail, Direktnachricht oder Telegram-Benachrichtigung verschickt. Verwenden Sie Beispieldaten.",
    received: "Test abgeschlossen",
    receivedHelp: "Es wurde nichts an den Shop gesendet oder dort gespeichert. Dieses Beispiel bleibt nur auf diesem Bildschirm und wird beim Neuladen gelöscht.",
    restart: "Anderes Beispiel ausprobieren",
    country: "Lieferland", language: "Sprache",
  },
  ru: {
    notice: "Это предварительный просмотр для проверки. Отправка этой формы не отправит обращение, электронное письмо, личное сообщение или уведомление Telegram. Используйте вымышленные данные.",
    received: "Тест отправки завершён",
    receivedHelp: "Ничего не отправлено в магазин и не сохранено в нём. Этот пример отображается только на текущем экране и исчезнет после обновления страницы.",
    restart: "Попробовать другой пример",
    country: "Страна доставки", language: "Язык",
  },
  it: {
    notice: "Questa è un’anteprima da verificare. Inviando questo modulo non verranno inviate richieste, e-mail, messaggi diretti o notifiche Telegram. Usa dati di esempio.",
    received: "Prova di invio completata",
    receivedHelp: "Non è stato inviato né salvato nulla nel negozio. Questo esempio rimane solo su questa schermata e viene cancellato quando aggiorni la pagina.",
    restart: "Provare un altro esempio",
    country: "Paese di consegna", language: "Lingua",
  },
  pt: {
    notice: "Esta é uma prévia para revisão. O envio deste formulário não enviará consulta, e-mail, mensagem direta ou notificação do Telegram. Use dados de exemplo.",
    received: "Teste de envio concluído",
    receivedHelp: "Nada foi enviado nem salvo na loja. Este exemplo fica apenas nesta tela e desaparece quando você atualiza a página.",
    restart: "Tentar outro exemplo",
    country: "País de entrega", language: "Idioma",
  },
  tr: {
    notice: "Bu, inceleme amaçlı bir önizlemedir. Bu formu göndermek herhangi bir talep, e-posta, doğrudan mesaj veya Telegram bildirimi göndermez. Örnek bilgiler kullanın.",
    received: "Gönderim testi tamamlandı",
    receivedHelp: "Mağazaya hiçbir şey gönderilmedi veya kaydedilmedi. Bu örnek yalnızca bu ekranda kalır ve sayfayı yenilediğinizde silinir.",
    restart: "Başka bir örnek dene",
    country: "Teslimat ülkesi", language: "Dil",
  },
  uz: {
    notice: "Bu tekshirish uchun oldindan ko‘rish sahifasi. Ushbu shaklni yuborish murojaat, elektron xat, shaxsiy xabar yoki Telegram bildirishnomasini yubormaydi. Namunaviy ma’lumotlardan foydalaning.",
    received: "Yuborish sinovi yakunlandi",
    receivedHelp: "Do‘konga hech narsa yuborilmadi yoki saqlanmadi. Bu namuna faqat shu ekranda qoladi va sahifa yangilanganda yo‘qoladi.",
    restart: "Boshqa namunani sinash",
    country: "Yetkazib beriladigan davlat", language: "Til",
  },
  zh: {
    notice: "这是用于审核的预览页面。提交此表单不会发送咨询、电子邮件、私信或Telegram通知。请填写示例信息。",
    received: "提交测试完成",
    receivedHelp: "没有任何内容发送至店铺或保存在店铺中。此示例仅显示在当前页面，刷新后即会清除。",
    restart: "尝试其他示例",
    country: "配送国家", language: "语言",
  },
  "zh-Hant": {
    notice: "這是用於審核的預覽頁面。提交此表單不會發送諮詢、電郵、私訊或Telegram通知。請填寫示例資訊。",
    received: "提交測試完成",
    receivedHelp: "沒有任何內容發送至店鋪或保存在店鋪中。此示例僅顯示在當前頁面，刷新後即會清除。",
    restart: "嘗試其他示例",
    country: "配送國家", language: "語言",
  },
  hi: {
    notice: "यह समीक्षा के लिए एक पूर्वावलोकन है। यह फ़ॉर्म जमा करने से कोई पूछताछ, ईमेल, निजी संदेश या Telegram सूचना नहीं भेजी जाएगी। उदाहरण के लिए काल्पनिक जानकारी भरें।",
    received: "जमा करने का परीक्षण पूरा हुआ",
    receivedHelp: "दुकान को कुछ भी नहीं भेजा गया और न ही वहाँ कुछ सहेजा गया। यह उदाहरण सिर्फ़ इस स्क्रीन पर रहता है और पेज रीफ़्रेश करने पर हट जाता है।",
    restart: "दूसरा उदाहरण आज़माएँ",
    country: "डिलीवरी का देश", language: "भाषा",
  },
  tl: {
    notice: "Preview ito para sa pagsusuri. Ang pagsumite ng form na ito ay hindi magpapadala ng tanong, email, direktang mensahe o Telegram notification. Gumamit ng halimbawang impormasyon.",
    received: "Tapos na ang pagsubok sa pagsumite",
    receivedHelp: "Walang ipinadala o na-save sa tindahan. Nananatili lamang ang halimbawang ito sa screen na ito at mawawala kapag ni-refresh ang pahina.",
    restart: "Sumubok ng ibang halimbawa",
    country: "Bansang padadalhan", language: "Wika",
  },
};

export function contactPreviewCopy(locale: string): ContactPreviewCopy {
  return Object.hasOwn(CONTACT_PREVIEW_COPY, locale)
    ? CONTACT_PREVIEW_COPY[locale]
    : CONTACT_PREVIEW_COPY.en;
}
