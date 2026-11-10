/* ============================================================
   เกาะมุกต์.com — interactions + content rendering
   ============================================================ */

function initLucide() {
  if (!window.lucide?.createIcons) return;
  lucide.createIcons({
    attrs: { 'stroke-width': 2 },
  });
}

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

function resolveSiteBase() {
  const raw = (document.querySelector('meta[name="site-base"]')?.content || '').trim();
  if (raw && raw !== 'auto') {
    return raw.replace(/\/$/, '');
  }
  const path = location.pathname || '/';
  if (path.startsWith('/เกาะมุกต์.com')) return '/เกาะมุกต์.com';
  if (path.startsWith('/เกาะมุกต์.com')) return '/เกาะมุกต์.com';
  if (path.startsWith('/KOHMUK')) return '/KOHMUK';
  return '';
}

const SITE_BASE = resolveSiteBase();

function siteUrl(path) {
  const clean = String(path || '').replace(/^\//, '');
  return SITE_BASE ? `${SITE_BASE}/${clean}` : clean;
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let revealObserver;

function initReveal(root) {
  const targets = root
    ? [...root.querySelectorAll('.reveal:not(.is-in)')]
    : $$('.reveal:not(.is-in)');

  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
  }

  targets.forEach((el) => revealObserver.observe(el));
}

function authVariant(el) {
  if (el.hasAttribute('data-site-auth-footer')) return 'footer';
  return 'topbar';
}

function guestAuthHtml(variant) {
  if (variant === 'footer') {
    return `
      <div class="site-auth-panel site-auth-panel--footer site-auth-panel--guest">
        <p class="site-auth-panel__hint">เข้าร่วมชุมชนนักท่องเที่ยวและผู้ประกอบการเกาะมุกต์</p>
        <div class="site-auth-panel__actions site-auth-panel__actions--guest">
          <a href="${siteUrl('member/login.php')}" class="btn btn--login btn--sm site-auth-panel__btn"><i data-lucide="log-in" class="icon"></i> LOGIN</a>
          <a href="${siteUrl('member/register.php')}" class="btn btn--register btn--sm site-auth-panel__btn"><i data-lucide="user-plus" class="icon"></i> REGISTER</a>
        </div>
      </div>`;
  }

  return `
    <a href="${siteUrl('member/register.php')}" class="btn btn--join"><i data-lucide="user-plus" class="icon"></i> <span class="btn__label">สมัครสมาชิก</span><span class="btn__label btn__label--short">สมัคร</span></a>
    <a href="${siteUrl('member/login.php')}" class="btn btn--book"><i data-lucide="calendar-check" class="icon"></i> จองเลย</a>`;
}

function memberRoleLabel(data) {
  if (data.role === 'admin') return 'ผู้ดูแลระบบ';
  if (data.member_type === 'business') return 'ผู้ประกอบการ';
  return 'สมาชิกรีวิว';
}

function loggedInAuthHtml(data, variant) {
  const dashIcon = data.role === 'admin' ? 'shield' : 'layout-dashboard';
  const dashLabel = data.role === 'admin' ? 'หน้าแอดมิน' : 'แดชบอร์ด';

  if (variant === 'footer') {
    return `
      <div class="site-auth-panel site-auth-panel--footer">
        <div class="site-auth-panel__user">
          <span class="site-auth-panel__avatar" aria-hidden="true"><i data-lucide="user" class="icon"></i></span>
          <div class="site-auth-panel__meta">
            <span class="site-auth-panel__status">เข้าสู่ระบบแล้ว</span>
            <strong class="site-auth-panel__name" title="${escHtml(data.name)}">${escHtml(data.name)}</strong>
            <span class="site-auth-panel__role">${escHtml(memberRoleLabel(data))}</span>
          </div>
        </div>
        <div class="site-auth-panel__actions">
          <a href="${escHtml(data.dashboard_url)}" class="btn btn--register btn--sm site-auth-panel__btn site-auth-panel__btn--primary">
            <i data-lucide="${dashIcon}" class="icon"></i> ${escHtml(dashLabel)}
          </a>
          <a href="${escHtml(data.logout_url)}" class="site-auth-panel__btn site-auth-panel__btn--logout">
            <i data-lucide="log-out" class="icon"></i> ออกจากระบบ
          </a>
        </div>
      </div>`;
  }

  return `
    <span class="site-auth__name" title="${escHtml(data.name)}">${escHtml(data.name)}</span>
    <a href="${escHtml(data.dashboard_url)}" class="btn btn--register"><i data-lucide="${dashIcon}" class="icon"></i> ${escHtml(dashLabel)}</a>
    <a href="${escHtml(data.logout_url)}" class="btn btn--login"><i data-lucide="log-out" class="icon"></i> ออกจากระบบ</a>`;
}

async function initSiteAuth() {
  const containers = $$('[data-site-auth]');
  if (!containers.length) return;

  containers.forEach((el) => {
    el.innerHTML = guestAuthHtml(authVariant(el));
  });
  initLucide();

  try {
    const res = await fetch(siteUrl('api/me.php'), { credentials: 'same-origin' });
    if (!res.ok) return;

    const data = await res.json();
    if (!data?.logged_in) return;

    containers.forEach((el) => {
      el.innerHTML = loggedInAuthHtml(data, authVariant(el));
    });

    const topbarMember = $('.topbar__member');
    if (topbarMember) {
      topbarMember.textContent = `สวัสดี, ${data.name}`;
    }

    const reviewCta = $('#reviewAuthCta');
    if (reviewCta) {
      if (data.role === 'admin') {
        reviewCta.href = data.dashboard_url;
        reviewCta.textContent = 'หน้าแอดมิน';
      } else if (data.can_post && data.action_url) {
        reviewCta.href = data.action_url;
        reviewCta.textContent = data.action_label;
        reviewCta.classList.remove('btn--purple');
        reviewCta.classList.add('btn--green');
      } else {
        reviewCta.href = data.dashboard_url;
        reviewCta.textContent = 'แดชบอร์ดสมาชิก';
      }
    }

    initLucide();
  } catch (_) {
    /* ใช้ปุ่ม guest ตามเดิม */
  }
}

/* รูปภาพจาก https://xn--72c1af2cbv3ee4v.com/ (Talay Trang) + Pexels + Booking (ที่พักเกาะมุกต์จริง) */
const TT = 'https://xn--72c1af2cbv3ee4v.com';
const W = { card: 640, thumb: 180, hero: 1400, gallery: 600, mini: 420, avatar: 120, van: 640, footer: 1200 };
const px = (id, w = W.card) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const upload = (file) => `${TT}/assets/uploads/${file}`;
/** รูปจริงจาก Booking.com CDN */
const bk = (id, k, size = 'max1024x768') =>
  `https://cf.bstatic.com/xdata/images/hotel/${size}/${id}.jpg?k=${k}&o=`;
const thumb = (url) => {
  if (url.includes('pexels.com')) return url.replace(/w=\d+/, `w=${W.thumb}`);
  if (url.includes('bstatic.com')) return url.replace(/\/max\d+x\d+\//, '/max300/');
  return url;
};

const cImg = (id) => px(id, W.card);
const gImg = (id) => px(id, W.gallery);

const articleMedia = (heroId, galleryIds) => ({
  hero: cImg(heroId),
  gallery: galleryIds.map(gImg),
});

const articleMediaUpload = (file, galleryIds) => ({
  hero: upload(file),
  gallery: galleryIds.map(gImg),
});

/* รูป hero + gallery ต่อเรื่อง — เรียงตามลำดับการ์ดในหน้าแรก */
const ARTICLE_MEDIA = {
  activity: [
    articleMedia(6691933, [36405819, 15763636, 17942107, 14573822]),       // ดูพะยูน
    articleMedia(1267320, [2037926, 36405819, 4171737, 1032650]),          // ป่าชายเลน
    articleMedia(1032650, [1647064, 271624, 14573822, 13419316]),          // พระอาทิตย์ตกแหลมจุโหย
    articleMedia(2037926, [566566, 2673353, 302899, 271624]),             // วิถีชุมชน/อาหารพื้นบ้าน
    articleMedia(15763636, [1450363, 18297054, 17942107, 13419316]),       // ดำน้ำตื้น
    articleMedia(4171737, [2098085, 566345, 725991, 14573822]),            // ตกหมึก
    articleMedia(100582, [271624, 36405819, 1032650, 261102]),             // ปั่นจักรยาน
    articleMedia(261102, [271624, 29974430, 1591376, 1032650]),            // โฮมสเตย์
  ],
  tour: [
    articleMediaUpload('20260612-141642-be55380f.png', [1450363, 2486168, 13419316, 1647064]),
    articleMedia(15763636, [13419316, 1450363, 1647064, 18297054]),        // เกาะกระดาน
    articleMedia(18297054, [15763636, 1450363, 17942107, 13419316]),       // ดำน้ำลึก
    articleMedia(2486168, [1647064, 1032650, 1267320, 1450363]),           // เกาะมุก/ถ้ำมรกต
    articleMedia(6691933, [36405819, 15763636, 1267320, 17942107]),        // ชมพะยูน
    articleMedia(4171737, [2098085, 566345, 725991, 14573822]),            // ตกหมึก
    articleMedia(1267320, [2037926, 36405819, 1032650, 4171737]),          // ป่าชายเลน
    articleMediaUpload('20260602-181538-54158826.png', [17942107, 14573822, 1647064, 1450363]),
  ],
  restaurant: [
    articleMedia(566566, [725991, 566345, 2673353, 1581384]),             // ครัวเลซีฟู้ด
    articleMedia(2673353, [302899, 1438671, 566566, 2037926]),            // ข้าวยำป้าแดง
    articleMedia(302899, [1581384, 1032650, 271624, 1647064]),             // คาเฟ่ริมทะเล
    articleMedia(566345, [566566, 725991, 2098085, 2673353]),              // ปูม้า/กุ้งเผา
    articleMedia(2098085, [566345, 725991, 566566, 1438671]),              // ปลาหมึกย่าง
    articleMedia(1438671, [2673353, 566566, 302899, 2098085]),             // แกงส้ม
    articleMedia(725991, [566566, 566345, 1581384, 1438671]),              // อาหารทะเล/หอย
    articleMedia(1581384, [1032650, 1647064, 566566, 271624]),             // ร้านวิวทะเล
  ],
};

const IMG = {
  hero: [
    upload('20260602-131052-5ab9ec8c.png'),
    upload('20260602-131107-bcb7fc4b.png'),
    upload('20260602-131058-7e606846.png'),
    px(14573822, W.hero),
    px(1647064, W.hero),
  ],
  activities: ARTICLE_MEDIA.activity.map((m) => m.hero),
  tours: ARTICLE_MEDIA.tour.map((m) => m.hero),
  boats: [
    upload('20260602-181538-54158826.png'),
    upload('20260602-181649-b834b3a1.png'),
    upload('20260602-181740-ef2b0dd3.png'),
    px(14573822, W.card),
    px(1647064, W.card),
    px(2486168, W.card),
    px(4171737, W.card),
    px(15763636, W.card),
  ],
  hotelGalleries: [
    /* มุกต์ บีช รีสอร์ท — Muk Beach Resort */
    [
      bk(687099515, '687e7c05a5acf389b2c3d9346ae952488c4acf670bab05dfd74f079cdb815dc4'),
      bk(687093925, 'b05b56608b26f26bd2c06b62ac8012edfecc3e669e247cb0bd292013aeb621f5'),
      bk(172989173, '705e1292e78a91f075c9cedbf45d78d8127ccff352a1c5aa64f04bbd998edd34'),
      bk(406488113, 'b0fdaf8a8cf3b5694b7e3eae7e83f3a0302f1f88db9ea3d0bc4858800bfad850'),
      bk(687097759, 'f0482a38ee6653d2cea9ba05dbf950b9d1230d5f475b1b48df27588464c22139'),
      bk(687097881, 'cac714d88cb2e6c79ff03cdd95660413e82f72ccf878baff6e87a257b72d2cc2'),
      bk(687097758, 'c4e254b5b506002a9a5c1ee994ccd7950b862d41bea46fa1d6002b99b90ad64c'),
      bk(406488007, 'd44cba77fe5461afac2c6ea40b4dcee6f35600bf854042ad4c109dd3335cf423'),
    ],
    /* หลังเขา โฮมสเตย์ — Langkao / โฮมสเตย์เกาะมุกต์จริง */
    [
      bk(803846458, '3fc8cdf6b10438d5035b691fe91f0ed3031d28b440f7c7c8ab06ff2e38812491'),
      bk(340339942, 'a787628d959e24189f4f6a89a339279f736b227151ae6685526610fc1301f778'),
      bk(340345494, '0347545629b386c98d00ca938e68f30b2d299f5d013b1addcbd15381f039fd20'),
      bk(605198512, '872767ffd0efbbc048cba4a8bc744a4164aea080979afad48e224bfd12bc9de6'),
      bk(605198631, '23f7a411b77512c5edcbfd2cf15e1d3d51878ecbb74d2ba8ca8a5747b13563ab'),
      bk(605201302, 'f6930af39dfb689c0795309f61bc278c38a87eb4cfd1dd37a852b35bbc0ce189'),
      bk(663547724, '06825dc608e00d80302848f2db86bc5826b9a880100ab946b240c63a0a4f0834'),
      bk(442216842, '6c53a223d175ef70d9bb435f2b7280fd7e028273bbae08b804db265542cbf49c'),
    ],
    /* ดูหยง ซีวิว บังกะโล — Le Dugong Muk Resort */
    [
      bk(590917483, '54c3973ea56819e8d9aaf3c75139ed0dc85c8230f1e66925d3c46c60e342adf2'),
      bk(590691497, 'fdbad430de69f119962d786d52514a51b9f647a5293294d7a167155a56ab405d'),
      bk(590694961, 'b8bed2c764c20b83128ffca7065f9a32c1c7ef2544e9e859b36f4d72aa66bb5a'),
      bk(590692579, '275a2128449e6f798134895bae0d3cb4cb955217e6dee7cf41a48c0b1f97d104'),
      bk(590690962, '8e1deba38251723c12348ffa8487fe64104ac07634a7d750508340dd6ec79311'),
      bk(590693501, '4f9195bbc8ccdda0b4186b0f075578dbb3e91683c617c065c9ddeed66585a544'),
      bk(590694293, '8dbd35fe9f32f2479833945b77c81ee020d388a1cfd1cfdbf17f0f6c9c816ccf'),
      bk(271241141, '7d35cab9fb2ec3079879a8e3f3bc5abfa82f4f02fe789d38cedfff6d2fb3a985'),
    ],
    /* เลตรัง รีสอร์ท แอนด์ สปา — Andalay Beach Resort Koh Muk */
    [
      bk(148166215, '9687dacf591103065da73e65b45ad2ec49cb86d7495b7e06bb565281643f9638'),
      bk(88450611, '7631eea4dccbd1e15b0906763557af616dc16bb418dc13efd7e877ef4db713fd'),
      bk(224179908, '2be9177a28d6650e1fd15ffb18cdc6b383ec9c7965735c1cb44c9ffdd6ba2c68'),
      bk(183281163, '8ff669340e16b196741aa1cdf1c3aeeec9f08506b2d8a23a265fbd2f57924c63'),
      bk(504446337, '2dee360f49ba68da5ccac4f38bfd0c8baf32718768516fa34d7ec0b8f0e8d6d5'),
      bk(504447541, '62699814ed8c71e6ff6ca8dcb2cf90d655fdb84b7184b7cd42e89b84f2625a28'),
      bk(610031610, '7c4416bdf73a25bd7ca77943ef93b71741ec0da3b067a2869ea4b1094b38f6aa'),
      bk(147831008, 'b92f2e81561efedfaeca6f4da991960f0a1367923f7c98fd46a93348c72023b5'),
    ],
    /* โคโคนัท บีช รีสอร์ท */
    [
      bk(183281163, '8ff669340e16b196741aa1cdf1c3aeeec9f08506b2d8a23a265fbd2f57924c63'),
      bk(687099515, '687e7c05a5acf389b2c3d9346ae952488c4acf670bab05dfd74f079cdb815dc4'),
      bk(687093925, 'b05b56608b26f26bd2c06b62ac8012edfecc3e669e247cb0bd292013aeb621f5'),
      bk(504446337, '2dee360f49ba68da5ccac4f38bfd0c8baf32718768516fa34d7ec0b8f0e8d6d5'),
      bk(172989173, '705e1292e78a91f075c9cedbf45d78d8127ccff352a1c5aa64f04bbd998edd34'),
      bk(406488113, 'b0fdaf8a8cf3b5694b7e3eae7e83f3a0302f1f88db9ea3d0bc4858800bfad850'),
      bk(147831008, 'b92f2e81561efedfaeca6f4da991960f0a1367923f7c98fd46a93348c72023b5'),
      bk(88450611, '7631eea4dccbd1e15b0906763557af616dc16bb418dc13efd7e877ef4db713fd'),
    ],
    /* สวนมะพร้าว โฮมสเตย์ */
    [
      bk(340339942, 'a787628d959e24189f4f6a89a339279f736b227151ae6685526610fc1301f778'),
      bk(803846458, '3fc8cdf6b10438d5035b691fe91f0ed3031d28b440f7c7c8ab06ff2e38812491'),
      bk(605198512, '872767ffd0efbbc048cba4a8bc744a4164aea080979afad48e224bfd12bc9de6'),
      bk(340345494, '0347545629b386c98d00ca938e68f30b2d299f5d013b1addcbd15381f039fd20'),
      bk(605198631, '23f7a411b77512c5edcbfd2cf15e1d3d51878ecbb74d2ba8ca8a5747b13563ab'),
      bk(663547724, '06825dc608e00d80302848f2db86bc5826b9a880100ab946b240c63a0a4f0834'),
      bk(442216842, '6c53a223d175ef70d9bb435f2b7280fd7e028273bbae08b804db265542cbf49c'),
      bk(605201302, 'f6930af39dfb689c0795309f61bc278c38a87eb4cfd1dd37a852b35bbc0ce189'),
    ],
    /* มุกต์ วิว บังกะโล */
    [
      bk(590691497, 'fdbad430de69f119962d786d52514a51b9f647a5293294d7a167155a56ab405d'),
      bk(590917483, '54c3973ea56819e8d9aaf3c75139ed0dc85c8230f1e66925d3c46c60e342adf2'),
      bk(590694961, 'b8bed2c764c20b83128ffca7065f9a32c1c7ef2544e9e859b36f4d72aa66bb5a'),
      bk(590692579, '275a2128449e6f798134895bae0d3cb4cb955217e6dee7cf41a48c0b1f97d104'),
      bk(590690962, '8e1deba38251723c12348ffa8487fe64104ac07634a7d750508340dd6ec79311'),
      bk(590693501, '4f9195bbc8ccdda0b4186b0f075578dbb3e91683c617c065c9ddeed66585a544'),
      bk(271241141, '7d35cab9fb2ec3079879a8e3f3bc5abfa82f4f02fe789d38cedfff6d2fb3a985'),
      bk(590694293, '8dbd35fe9f32f2479833945b77c81ee020d388a1cfd1cfdbf17f0f6c9c816ccf'),
    ],
    /* อันดามัน บีช รีสอร์ท มุกต์ */
    [
      bk(224179908, '2be9177a28d6650e1fd15ffb18cdc6b383ec9c7965735c1cb44c9ffdd6ba2c68'),
      bk(148166215, '9687dacf591103065da73e65b45ad2ec49cb86d7495b7e06bb565281643f9638'),
      bk(504447541, '62699814ed8c71e6ff6ca8dcb2cf90d655fdb84b7184b7cd42e89b84f2625a28'),
      bk(610031610, '7c4416bdf73a25bd7ca77943ef93b71741ec0da3b067a2869ea4b1094b38f6aa'),
      bk(687097759, 'f0482a38ee6653d2cea9ba05dbf950b9d1230d5f475b1b48df27588464c22139'),
      bk(687097881, 'cac714d88cb2e6c79ff03cdd95660413e82f72ccf878baff6e87a257b72d2cc2'),
      bk(406488007, 'd44cba77fe5461afac2c6ea40b4dcee6f35600bf854042ad4c109dd3335cf423'),
      bk(687097758, 'c4e254b5b506002a9a5c1ee994ccd7950b862d41bea46fa1d6002b99b90ad64c'),
    ],
  ],
  miniSlides: [
    bk(687099515, '687e7c05a5acf389b2c3d9346ae952488c4acf670bab05dfd74f079cdb815dc4'),
    bk(803846458, '3fc8cdf6b10438d5035b691fe91f0ed3031d28b440f7c7c8ab06ff2e38812491'),
    bk(590917483, '54c3973ea56819e8d9aaf3c75139ed0dc85c8230f1e66925d3c46c60e342adf2'),
    bk(148166215, '9687dacf591103065da73e65b45ad2ec49cb86d7495b7e06bb565281643f9638'),
    bk(183281163, '8ff669340e16b196741aa1cdf1c3aeeec9f08506b2d8a23a265fbd2f57924c63'),
    bk(340339942, 'a787628d959e24189f4f6a89a339279f736b227151ae6685526610fc1301f778'),
    bk(687093925, 'b05b56608b26f26bd2c06b62ac8012edfecc3e669e247cb0bd292013aeb621f5'),
    bk(590691497, 'fdbad430de69f119962d786d52514a51b9f647a5293294d7a167155a56ab405d'),
  ],
  reviews: [
    px(6698714, W.avatar),
    px(237741, W.avatar),
    px(90427, W.avatar),
    px(1450363, W.avatar),
    px(31029704, W.avatar),
    px(13680386, W.avatar),
    px(6173672, W.avatar),
    px(769289, W.avatar),
  ],
  restaurants: ARTICLE_MEDIA.restaurant.map((m) => m.hero),
  van: px(15804640, W.van),
  footer: px(14573822, W.footer),
};

function loadBg(el) {
  const url = el.dataset.bg;
  if (!url || el.dataset.loaded) return;
  el.style.backgroundImage = `url('${url}')`;
  el.dataset.loaded = '1';
}

function preloadImage(url) {
  const img = new Image();
  img.src = url;
}

  /* ---------- HERO CAROUSEL ---------- */
  (function heroCarousel() {
    const slides = $$('.hero__slide');
    const dotsWrap = $('#heroDots');
    if (!slides.length) return;

    let i = 0;
    let timer;

    function ensureSlideBg(n) {
      const slide = slides[n];
      if (slide) loadBg(slide);
    }

    slides.forEach((slide, idx) => {
      if (idx === 1) preloadImage(slide.dataset.bg);
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'สไลด์ ' + (idx + 1));
      if (idx === 0) b.classList.add('is-active');
      b.addEventListener('click', () => go(idx));
      dotsWrap.appendChild(b);
    });
    const dots = $$('button', dotsWrap);

    function go(n) {
      slides[i].classList.remove('is-active');
      dots[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      ensureSlideBg(i);
      preloadImage(slides[(i + 1) % slides.length]?.dataset.bg);
      slides[i].classList.add('is-active');
      dots[i].classList.add('is-active');
      restart();
    }
    const next = () => go(i + 1);
    const prev = () => go(i - 1);
    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 5000);
    }

    $('#heroNext').addEventListener('click', next);
    $('#heroPrev').addEventListener('click', prev);
    ensureSlideBg(0);
    restart();
  })();

  /* ---------- MOBILE NAV ---------- */
  (function nav() {
    const header = $('#nav');
    const toggle = $('#navToggle');
    const menu = $('#navMenu');
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      header.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
      document.body.classList.toggle('nav-open', open);
    };

    toggle.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) setOpen(false);
    });
  })();

  /* ---------- HASH SECTION NAV (sticky header offset) ---------- */
  function headerNavOffset() {
    return ($('#nav')?.offsetHeight || 0) + 10;
  }

  function scrollToSectionId(id, behavior = 'smooth') {
    const el = document.getElementById(id);
    if (!el) return false;
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerNavOffset();
    window.scrollTo({ top: Math.max(0, top), behavior });
    return true;
  }

  function samePageAsLink(anchor) {
    try {
      const url = new URL(anchor.href, location.href);
      const here = location.pathname.replace(/\/$/, '') || '/';
      const there = url.pathname.replace(/\/$/, '') || '/';
      if (here === there) return true;
      const hereIndex = /(?:^|\/)index\.html$/.test(here) || /\/$/.test(location.pathname);
      const thereIndex = /(?:^|\/)index\.html$/.test(there);
      return hereIndex && thereIndex;
    } catch {
      return false;
    }
  }

  function applyLocationHash(behavior = 'auto') {
    const id = (location.hash || '').replace(/^#/, '');
    if (!id) return;
    scrollToSectionId(id, behavior);
  }

  (function initHashNav() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;

      const raw = a.getAttribute('href') || '';
      let id = '';
      if (raw.startsWith('#') && raw.length > 1 && !raw.startsWith('#/')) {
        id = raw.slice(1);
      } else if (raw.includes('#')) {
        try {
          id = new URL(a.href, location.href).hash.replace(/^#/, '');
        } catch {
          id = '';
        }
        if (!id || !samePageAsLink(a)) return;
      } else {
        return;
      }

      if (!document.getElementById(id)) return;
      e.preventDefault();
      history.pushState(null, '', `#${id}`);
      scrollToSectionId(id, 'smooth');
      $('#nav')?.classList.remove('is-open');
      $('#navMenu')?.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    });

    window.addEventListener('hashchange', () => applyLocationHash('smooth'));
    window.addEventListener('load', () => {
      applyLocationHash('auto');
      setTimeout(() => applyLocationHash('auto'), 250);
      setTimeout(() => applyLocationHash('auto'), 900);
    });
  })();

  /* ---------- TO TOP ---------- */
  (function toTop() {
    const btn = $('#toTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    });
  })();

  /* ---------- LAZY MAP + BACKGROUNDS ---------- */
  (function lazyEmbeds() {
    const map = $('#contactMap');
    if (map?.dataset.src) {
      const loadMap = () => {
        if (!map.src) map.src = map.dataset.src;
      };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries, io) => {
          if (entries[0].isIntersecting) {
            loadMap();
            io.disconnect();
          }
        }, { rootMargin: '240px' }).observe(map);
      } else {
        loadMap();
      }
    }

    $$('[data-bg]').forEach((el) => {
      if (el.classList.contains('hero__slide')) return;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries, io) => {
          if (entries[0].isIntersecting) {
            loadBg(el);
            io.disconnect();
          }
        }, { rootMargin: '200px' }).observe(el);
      } else {
        loadBg(el);
      }
    });
  })();

  /* ============================================================
     CONTENT DATA
     ============================================================ */
  const activities = [
    { t: 'ดูพะยูนกลางทะเลอันดามัน สัญลักษณ์ของเกาะมุกต์', tag: 'ไฮไลต์', m: 'เที่ยวเกาะ · 03 มิ.ย. 2026 · 402 อ่าน' },
    { t: 'ล่องเรือชมป่าชายเลนและหญ้าทะเลผืนใหญ่', tag: 'ธรรมชาติ', m: 'เที่ยวเกาะ · 26 พ.ค. 2026 · 296 อ่าน' },
    { t: 'ชมพระอาทิตย์ตกที่แหลมจุโหย จุดชมวิวสุดโรแมนติก', tag: 'วิวสวย', m: 'เที่ยวเกาะ · 18 พ.ค. 2026 · 886 อ่าน' },
    { t: 'สัมผัสวิถีชุมชนมุสลิมและอาหารพื้นบ้านรสเด็ด', tag: 'วัฒนธรรม', m: 'เที่ยวเกาะ · 30 มิ.ย. 2026 · 530 อ่าน' },
    { t: 'ดำน้ำดูปะการังน้ำตื้นรอบเกาะ น้ำใสมองเห็นพื้นทราย', tag: 'ดำน้ำ', m: 'เที่ยวเกาะ · 04 มิ.ย. 2026 · 898 อ่าน' },
    { t: 'ตกหมึกยามค่ำคืน กิจกรรมสุดฮิตของนักท่องเที่ยว', tag: 'กิจกรรม', m: 'เที่ยวเกาะ · 02 มิ.ย. 2026 · 463 อ่าน' },
    { t: 'ปั่นจักรยานเที่ยวรอบเกาะ สูดอากาศบริสุทธิ์', tag: 'ผจญภัย', m: 'เที่ยวเกาะ · 29 พ.ค. 2026 · 529 อ่าน' },
    { t: 'พักโฮมสเตย์ริมทะเล สัมผัสชีวิตชาวเล', tag: 'ที่พัก', m: 'เที่ยวเกาะ · 29 พ.ค. 2026 · 2,190 อ่าน' },
  ];

  const DEAL_STAR_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>';
  const DEAL_STARS_HTML = `<div class="deal-stars" aria-label="5 ดาว">${DEAL_STAR_SVG.repeat(5)}</div>`;

  let tourDealsCache = null;
  let tourCategoriesCache = null;

  const TOUR_DEALS_FALLBACK = [
    { id: 'dl001', code: 'DL001', title: '4 เกาะทะเลตรัง : เรือหางยาว', subtitle: 'ถ้ำมรกต เกาะกระดาน เกาะแหวน เกาะเชือก', price: '650', rating: '4.9', review_count: '4.8พัน', duration: 'ประมาณ 8 ชั่วโมง', image: 'https://xn--72c1af2cbv3ee4v.com/assets/uploads/20260612-141642-be55380f.png', category: 'daytrip' },
    { id: 'dt001', code: 'DT001', title: '4 เกาะทะเลตรัง : เรือทัวร์', subtitle: 'ถ้ำมรกต เกาะกระดาน เกาะแหวน เกาะเชือก', price: '950', rating: '4.9', review_count: '4.8พัน', duration: 'ประมาณ 8 ชั่วโมง', image: 'https://xn--72c1af2cbv3ee4v.com/assets/uploads/20260612-143741-9af064af.png', category: 'daytrip' },
    { id: 'ds001', code: 'DS001', title: '4 เกาะทะเลตรัง : สปีดโบ๊ท', subtitle: 'ถ้ำมรกต เกาะกระดาน เกาะแหวน เกาะเชือก', price: '1350', rating: '4.9', review_count: '4.8พัน', duration: 'ประมาณ 8 ชั่วโมง', image: 'https://www.xn--72c1af3ci9dk0j.com/wp-content/uploads/2024/10/1.jpg', category: 'daytrip' },
    { id: 'ds002', code: 'DS002', title: 'เกาะรอก เกาะม้า : สปีดโบ๊ท', subtitle: 'เกาะรอกนอก เกาะรอกใน เกาะม้า', price: '1650', rating: '4.9', review_count: '4.8พัน', duration: 'ประมาณ 8 ชั่วโมง', image: 'https://www.xn--72c1af3ci9dk0j.com/wp-content/uploads/2024/10/2.jpg', category: 'daytrip' },
    { id: 'ds006', code: 'DS006', title: 'เกาะเหลาเหลียง เกาะกระดาน ถ้ำมรกต : สปีดโบ๊ท', subtitle: 'เกาะเหลาเหลียง เกาะกระดาน ถ้ำมรกต', price: '2250', rating: '4.9', review_count: '500', duration: 'ประมาณ 8 ชั่วโมง', image: 'https://www.xn--72c1af3ci9dk0j.com/wp-content/uploads/2025/08/Untitled-design.png', category: 'daytrip' },
    { id: 'dl003', code: 'DL003', title: 'เจาะลึกเกาะมุกต์ : เรือหางยาว', subtitle: 'เจาะลึกเกาะมุกต์', price: '600', rating: '4.9', review_count: '4.8พัน', duration: 'ประมาณ 8 ชั่วโมง', image: 'https://www.xn--72c1af3ci9dk0j.com/wp-content/uploads/2019/06/%E0%B8%96%E0%B9%89%E0%B8%B3%E0%B8%A1%E0%B8%A3%E0%B8%81%E0%B8%95-1.jpg', category: 'daytrip' },
    { id: 'dl004', code: 'DL004', title: 'เจาะลึกเกาะไหง : เรือหางยาว', subtitle: 'เจาะลึกเกาะไหง', price: '600', rating: '4.9', review_count: '500', duration: 'ประมาณ 8 ชั่วโมง', image: 'https://www.xn--72c1af3ci9dk0j.com/wp-content/uploads/2024/10/Untitled-design-2-1.png', category: 'daytrip' },
    { id: 'dl005', code: 'DL005', title: 'เกาะเหลาเหลียง เกาะตะเกียง : เรือหางยาว', subtitle: 'เกาะเหลาเหลียง เกาะตะเกียง', price: '1350', rating: '4.8', review_count: '4.8 พัน', duration: 'ประมาณ 7 ชั่วโมง', image: 'https://xn--72c1af2cbv3ee4v.com/assets/uploads/20260701-195336-da9e6334.png', category: 'daytrip' },
  ];

  const TOUR_CATEGORY_META = {
    daytrip: { eyebrow: 'One-day trips' },
    overnight: { eyebrow: '2 Days 1 Night' },
    packages3d2n: { eyebrow: '3 Days 2 Nights' },
    packages4d3n: { eyebrow: '4 Days 3 Nights' },
  };

  const TOUR_CATEGORIES_FALLBACK = [
    {
      id: 'daytrip',
      label: 'ไปเช้าเย็นกลับ',
      title: 'แพ็กเกจไปเช้า เย็นกลับ',
      subtitle: 'ไปเช้าเย็นกลับ ทะเลตรัง 4 เกาะ เกาะเหลาเหลียง เกาะมุก เกาะไหง และเกาะรอก — เริ่มต้น 600 บาท ครบเรือ ไกด์ อาหาร และประกัน',
      packages: TOUR_DEALS_FALLBACK,
    },
  ];

  function formatDealPrice(value) {
    const n = Number(String(value ?? '').replace(/[^\d.]/g, ''));
    if (!Number.isFinite(n)) return String(value || '');
    return new Intl.NumberFormat('th-TH').format(n);
  }

  function dealCardHtml(item) {
    const price = formatDealPrice(item.price);
    const href = articleUrl('tour', item.id || item.code, item.title);
    const cover = item.image || item._image || IMG.tours[0];
    const code = item.code || String(item.id || '').toUpperCase();
    return `
    <a class="deal-card reveal" href="${escHtml(href)}">
      <div class="deal-media">
        <img src="${escHtml(cover)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async">
        <span class="deal-badge-tl">รหัส #${escHtml(code)}</span>
        <span class="deal-badge-tr is-info">${escHtml(price)} ฿</span>
      </div>
      <div class="deal-body">
        <h3>${escHtml(item.title)}</h3>
        ${item.subtitle ? `<p class="deal-sub">${escHtml(item.subtitle)}</p>` : ''}
        ${DEAL_STARS_HTML}
        <div class="deal-rate"><strong>${escHtml(item.rating || '4.9')}</strong>/5 <span class="dot"></span> <span>${escHtml(item.review_count || '0')} รีวิว</span></div>
        <div class="deal-price">
          <small>เริ่มต้น · ${escHtml(item.duration || 'ประมาณ 8 ชั่วโมง')}</small>
          <strong>THB ${escHtml(price)}</strong>
        </div>
      </div>
    </a>`;
  }

  function normalizeTourPackageData(data) {
    if (data && Array.isArray(data.categories) && data.categories.length) {
      const categories = data.categories.map((cat) => ({
        id: cat.id,
        label: cat.label || cat.title || cat.id,
        title: cat.title || cat.label || cat.id,
        subtitle: cat.subtitle || '',
        packages: (cat.packages || []).map((p) => ({ ...p, category: p.category || cat.id })),
      }));
      const packages = categories.flatMap((cat) => cat.packages);
      return { categories, packages };
    }
    if (Array.isArray(data) && data.length) {
      const packages = data.map((p) => ({ ...p, category: p.category || 'daytrip' }));
      return {
        categories: [{
          id: 'daytrip',
          label: 'ไปเช้าเย็นกลับ',
          title: 'แพ็กเกจไปเช้า เย็นกลับ',
          subtitle: TOUR_CATEGORIES_FALLBACK[0].subtitle,
          packages,
        }],
        packages,
      };
    }
    return {
      categories: TOUR_CATEGORIES_FALLBACK,
      packages: TOUR_DEALS_FALLBACK,
    };
  }

  function getDaytripDeals(items) {
    const fromCat = (tourCategoriesCache || []).find((c) => c.id === 'daytrip');
    if (fromCat?.packages?.length) return fromCat.packages;
    const list = Array.isArray(items) ? items : [];
    const day = list.filter((p) => !p.category || p.category === 'daytrip');
    return day.length ? day : list;
  }

  async function loadTourDeals() {
    if (tourDealsCache) return tourDealsCache;
    try {
      const res = await fetch(siteUrl('data/tour-packages.json'));
      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeTourPackageData(data);
        if (normalized.packages.length) {
          tourCategoriesCache = normalized.categories;
          tourDealsCache = normalized.packages;
          return tourDealsCache;
        }
      }
    } catch (_) {
      /* use fallback */
    }
    const normalized = normalizeTourPackageData(null);
    tourCategoriesCache = normalized.categories;
    tourDealsCache = normalized.packages;
    return tourDealsCache;
  }

  function renderTourDeals(items, selector = '#tourGrid', limit = null) {
    const grid = $(selector);
    if (!grid) return false;
    const source = Array.isArray(items) && items.length ? items : TOUR_DEALS_FALLBACK;
    const list = selector === '#tourGrid' ? getDaytripDeals(source) : source;
    const sliced = limit ? list.slice(0, limit) : list;
    registerContentSection('tour', tourDealsCache || source, (tourDealsCache || source).map((item) => item.image || IMG.tours[0]));
    grid.innerHTML = sliced.map(dealCardHtml).join('');
    initReveal(grid);
    return true;
  }

  function setActiveCategoryNav(categoryId) {
    const nav = $('#programsCategoryNav');
    if (!nav) return;
    $$('.programs-category-nav-link', nav).forEach((link) => {
      link.classList.toggle('is-active', link.dataset.categoryJump === categoryId);
    });
  }

  function jumpToProgramCategory(categoryId, { updateHash = true } = {}) {
    if (!categoryId) return;
    const target = document.getElementById(categoryId);
    if (!target) return;
    setActiveCategoryNav(categoryId);
    if (updateHash && location.hash !== `#${categoryId}`) {
      history.replaceState(null, '', `#${categoryId}`);
    }
    const top = target.getBoundingClientRect().top + window.scrollY - ((parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 64) + 12);
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function renderProgramsCatalog(categories) {
    const nav = $('#programsCategoryNav');
    const catalog = $('#programsCatalog');
    if (!catalog) return false;
    const cats = Array.isArray(categories) && categories.length ? categories : TOUR_CATEGORIES_FALLBACK;
    const allPackages = cats.flatMap((c) => c.packages || []);
    registerContentSection('tour', allPackages, allPackages.map((item) => item.image || IMG.tours[0]));

    if (nav) {
      nav.innerHTML = cats.map((cat) => `
        <a class="programs-category-nav-link" href="#${escHtml(cat.id)}" data-category-jump="${escHtml(cat.id)}">
          ${escHtml(cat.label)}
          <span class="programs-category-nav-count">${(cat.packages || []).length}</span>
        </a>`).join('');
      nav.onclick = (e) => {
        const link = e.target.closest('[data-category-jump]');
        if (!link) return;
        e.preventDefault();
        jumpToProgramCategory(link.dataset.categoryJump);
      };
    }

    catalog.innerHTML = cats.map((cat) => {
      const eyebrow = TOUR_CATEGORY_META[cat.id]?.eyebrow || cat.label;
      const cards = (cat.packages || []).map(dealCardHtml).join('');
      return `
      <section class="programs-category" id="${escHtml(cat.id)}" data-category="${escHtml(cat.id)}">
        <div class="programs-category__head reveal">
          <span class="programs-category__eyebrow">${escHtml(eyebrow)}</span>
          <h2>${escHtml(cat.title)}</h2>
          ${cat.subtitle ? `<p class="lead">${escHtml(cat.subtitle)}</p>` : ''}
        </div>
        <div class="deals-grid grid-4 programs-category-grid">${cards}</div>
      </section>`;
    }).join('');

    initReveal(catalog);
    const hash = (location.hash || '').replace(/^#/, '');
    const initial = cats.some((c) => c.id === hash) ? hash : cats[0]?.id;
    if (initial) {
      setActiveCategoryNav(initial);
      if (hash && cats.some((c) => c.id === hash)) {
        requestAnimationFrame(() => jumpToProgramCategory(hash, { updateHash: false }));
      }
    }
    return true;
  }

  const boats = [
    { id: 'boat-01', t: 'เข้า-ออกเกาะมุกต์', desc: 'เหมาเรือหางยาวรับ-ส่งท่าเรือหาดยาว / ควนตุ้งกู — บ้านพร้าว เลือกเวลาได้', price: '800' },
    { id: 'boat-02', t: 'ถ้ำมรกต + หาดลับ', desc: 'ล่องเรือจากเกาะมุกต์ ว่ายลอดถ้ำมรกต ชมหาดลับน้ำใสสีมรกต', price: '1,500' },
    { id: 'boat-03', t: 'ทะเลตรัง 4 เกาะ', desc: 'ถ้ำมรกต เกาะกระดาน เกาะแหวน เกาะเชือก — เหมาลำส่วนตัวทั้งวัน', price: '2,700' },
    { id: 'boat-04', t: 'เกาะมุกต์ → เกาะไหง', desc: 'ข้ามเกาะไปเกาะไหง พักผ่อนชายหาดขาว ดำน้ำตื้นหน้าหาด', price: '1,500' },
    { id: 'boat-05', t: 'เกาะมุกต์ → เกาะกระดาน', desc: 'ไปเกาะกระดานชมหาดและปะการัง ส่งถึงชายหาดรีสอร์ท', price: '1,800' },
    { id: 'boat-06', t: 'ดำน้ำตื้น / ดูปะการัง', desc: 'พาไปจุดดำน้ำรอบเกาะมุกต์ รวมอุปกรณ์และเสื้อชูชีพ', price: '1,800' },
    { id: 'boat-07', t: 'ทริปตกหมึกกลางคืน', desc: 'ออกเรือยามค่ำ ตกหมึกกับลูกเรือท้องถิ่น เหมาะกลุ่มเพื่อนและครอบครัว', price: '2,000' },
    { id: 'boat-08', t: 'เกาะเหลาเหลียง / เกาะรอก', desc: 'ทริปยาวไปเกาะเหลาเหลียงหรือเกาะรอก เหมาสปีดโบ๊ท / เรือหางยาว', price: '5,000' },
  ];

  const hotels = [
    { t: 'มุกต์ บีช รีสอร์ท', loc: 'หาดบ้านพร้าว, เกาะมุกต์', stars: 4, am: ['Wi-Fi ฟรี', 'ติดทะเล', 'อาหารเช้า'], desc: 'ที่พักริมหาดบรรยากาศเงียบสงบ มองเห็นวิวทะเลอันดามัน เดินถึงชายหาดได้ทันที', price: '4,740' },
    { t: 'หลังเขา โฮมสเตย์ มุกต์', loc: 'บ้านบาตูปูเต๊ะ, เกาะมุกต์', stars: 4, am: ['Wi-Fi ฟรี', 'จักรยานฟรี', 'จุดชมวิว'], desc: 'โฮมสเตย์วิถีชุมชน สัมผัสชีวิตชาวเลแท้ ๆ พร้อมอาหารพื้นบ้านรสเด็ดทุกมื้อ', price: '1,290' },
    { t: 'ดูหยง ซีวิว บังกะโล', loc: 'แหลมจุโหย, เกาะมุกต์', stars: 5, am: ['Wi-Fi ฟรี', 'สระว่ายน้ำ', 'ติดทะเล'], desc: 'บังกะโลริมทะเลพร้อมระเบียงส่วนตัว ชมพระอาทิตย์ตกได้จากห้องพัก', price: '3,200' },
    { t: 'เลตรัง รีสอร์ท แอนด์ สปา', loc: 'หาดทุ่งหญ้าคา, เกาะมุกต์', stars: 5, am: ['สปา', 'สระว่ายน้ำ', 'อาหารเช้า'], desc: 'รีสอร์ทระดับพรีเมียม พร้อมสปาและสระว่ายน้ำ บริการครบครันเพื่อการพักผ่อน', price: '5,900' },
    { t: 'โคโคนัท บีช รีสอร์ท', loc: 'หาดบ้านพร้าว, เกาะมุกต์', stars: 4, am: ['Wi-Fi ฟรี', 'ติดทะเล', 'ร้านอาหาร'], desc: 'รีสอร์ทร่มเงาต้นมะพร้าว ใกล้ชายหาด เหมาะพักผ่อนแบบสบาย ๆ', price: '3,850' },
    { t: 'สวนมะพร้าว โฮมสเตย์', loc: 'บ้านพร้าว, เกาะมุกต์', stars: 3, am: ['Wi-Fi ฟรี', 'อาหารเช้า', 'ที่จอดรถ'], desc: 'โฮมสเตย์ในสวน เงียบสงบ ใกล้ชุมชนและสะดวกเดินทางไปท่าเรือ', price: '990' },
    { t: 'มุกต์ วิว บังกะโล', loc: 'หาดตะโละ, เกาะมุกต์', stars: 4, am: ['Wi-Fi ฟรี', 'ระเบียงวิว', 'ใกล้ชายหาด'], desc: 'บังกะโลวิวทะเล ห้องโปร่งโล่ง นั่งชิลล์ริมระเบียงได้ทั้งวัน', price: '2,450' },
    { t: 'อันดามัน บีช รีสอร์ท มุกต์', loc: 'หาดบ้านพร้าว, เกาะมุกต์', stars: 5, am: ['สระว่ายน้ำ', 'อาหารเช้า', 'ติดทะเล'], desc: 'รีสอร์ทวิวอันดามัน บริการครบ เหมาะครอบครัวและคู่รัก', price: '5,200' },
  ];

  const hotelGalleries = {};

  function getHotelImages(urls, title) {
    return urls.map((src, i) => ({
      src,
      thumb: thumb(src),
      alt: `${title} — ภาพที่ ${i + 1}`,
    }));
  }

  function renderHotelGallery(id, urls, title) {
    const images = getHotelImages(urls, title);
    hotelGalleries[id] = images;
    const cover = images[0]?.src || '';

    return `
      <div class="hotel-card__gallery hotel-card__gallery--single">
        <div class="hotel-card__hero">
          <img src="${escHtml(cover)}" alt="${escHtml(title)}" loading="lazy" decoding="async">
        </div>
      </div>`;
  }

  const restaurants = [
    { t: 'ครัวเล มุกต์ ซีฟู้ด อาหารทะเลสดจากเรือประมงพื้นบ้าน', m: 'ร้านอาหาร · 03 มิ.ย. 2026 · 402 อ่าน' },
    { t: 'ร้านป้าแดง ข้าวยำปักษ์ใต้ น้ำบูดูสูตรต้นตำรับ', m: 'ร้านอาหาร · 26 พ.ค. 2026 · 296 อ่าน' },
    { t: 'ลานเล คาเฟ่ ริมทะเล กาแฟสดและของหวาน', m: 'ร้านอาหาร · 18 พ.ค. 2026 · 886 อ่าน' },
    { t: 'ครัวบ้านพร้าว ปูม้านึ่ง กุ้งเผา ราคาชาวบ้าน', m: 'ร้านอาหาร · 20 มิ.ย. 2026 · 4,567 อ่าน' },
    { t: 'ร้านลุงหมึก ปลาหมึกย่าง สดใหม่ทุกวัน', m: 'ร้านอาหาร · 04 มิ.ย. 2026 · 612 อ่าน' },
    { t: 'ครัวยายแป้น แกงส้มปลากะพง รสจัดจ้าน', m: 'ร้านอาหาร · 02 มิ.ย. 2026 · 380 อ่าน' },
    { t: 'ซีฟู้ดบ้านบาตู ออส่วน หอยนางรมสด', m: 'ร้านอาหาร · 29 พ.ค. 2026 · 529 อ่าน' },
    { t: 'ครัวมุกต์วิว อาหารใต้ พร้อมวิวทะเลพาโนรามา', m: 'ร้านอาหาร · 29 พ.ค. 2026 · 2,190 อ่าน' },
  ];

  /* ============================================================
     RENDER
     ============================================================ */
  const starStr = (n) => {
    let html = '<span class="stars">';
    for (let i = 0; i < n; i++) {
      html += '<span class="star-icon star-icon--filled"><i data-lucide="star" class="icon"></i></span>';
    }
    for (let i = n; i < 5; i++) {
      html += '<span class="star-icon"><i data-lucide="star" class="icon"></i></span>';
    }
    return html + '</span>';
  };

  const contentRegistry = {};

  function enrichArticleItem(section, item, k, fallbackImgs) {
    const media = ARTICLE_MEDIA[section]?.[k % (ARTICLE_MEDIA[section]?.length || 1)];
    const hero = item.image || media?.hero || fallbackImgs[k % fallbackImgs.length];
    let gallery = item.gallery?.length >= 3 ? item.gallery : null;
    if (!gallery && item.image) {
      gallery = [
        item.image,
        media?.gallery?.[0] || fallbackImgs[(k + 1) % fallbackImgs.length],
        media?.gallery?.[1] || fallbackImgs[(k + 2) % fallbackImgs.length],
        media?.gallery?.[2] || fallbackImgs[(k + 3) % fallbackImgs.length],
        media?.gallery?.[3] || fallbackImgs[(k + 4) % fallbackImgs.length],
        media?.gallery?.[4] || fallbackImgs[(k + 5) % fallbackImgs.length],
      ];
    }
    if (!gallery && media?.gallery) gallery = media.gallery;
    if (!gallery || gallery.length < 3) {
      gallery = [
        hero,
        fallbackImgs[(k + 1) % fallbackImgs.length],
        fallbackImgs[(k + 2) % fallbackImgs.length],
        fallbackImgs[(k + 3) % fallbackImgs.length],
        fallbackImgs[(k + 4) % fallbackImgs.length],
        fallbackImgs[(k + 5) % fallbackImgs.length],
      ];
    }
    const galleryLimit = section === 'tour' ? 6 : 4;
    return { ...item, gallery: gallery.slice(0, galleryLimit), image: hero };
  }

  const ARTICLE_ENRICHERS = {
    activity: enrichArticleItem,
    tour: enrichArticleItem,
    restaurant: enrichArticleItem,
  };

  function registerContentSection(section, items, fallbackImgs, enrich) {
    const enrichFn = enrich || (ARTICLE_ENRICHERS[section]
      ? (item, k, fb) => enrichArticleItem(section, item, k, fb)
      : null);
    contentRegistry[section] = items.map((item, k) => {
      const base = enrichFn ? enrichFn(item, k, fallbackImgs) : { ...item };
      const image = base.image || fallbackImgs[k % fallbackImgs.length];
      return {
        ...base,
        _key: String(base.id ?? k),
        _index: k,
        _image: image,
        _gallery: base.gallery || null,
      };
    });
  }

  function cardClickAttrs(section, item, k, extraClass = '') {
    const key = String(item.id ?? k);
    const cls = ['card', 'card--clickable', 'reveal', 'is-in', extraClass].filter(Boolean).join(' ');
    return `class="${cls}" data-content-section="${section}" data-content-id="${key}" data-content-title="${escHtml(item.title || '')}" tabindex="0" role="button"`;
  }

  function cardHintHtml() {
    return '<span class="card__hint">ดูรายละเอียด →</span>';
  }

  function articleUrl(section, id, title = '') {
    const q = new URLSearchParams({ section, id: String(id) });
    if (title) q.set('title', title);
    return siteUrl(`article.html?${q.toString()}`);
  }

  function contactUrl() {
    return siteUrl('contact.html');
  }

  function getContentItem(section, id, title = '') {
    const list = contentRegistry[section];
    if (!list) return null;
    const needle = String(id || '').trim();
    const needleLower = needle.toLowerCase();
    return list.find((it) => it._key === needle)
      || list.find((it) => String(it.id || '').toLowerCase() === needleLower)
      || list.find((it) => String(it.code || '').toLowerCase() === needleLower)
      || (title ? list.find((it) => it.title === title) : null)
      || null;
  }

  const CONTENT_SECTION_LABELS = {
    activity: 'ไฮไลต์',
    tour: 'แพ็คเกจทัวร์',
    restaurant: 'ร้านอาหาร',
    hotel: 'ที่พัก',
    hotel_mini: 'บทความที่พัก',
    boat: 'ตั๋วเรือ',
    review: 'รีวิวจริง',
  };

  const NETWORK_SITES = [
    {
      title: 'ทะเลตรัง',
      desc: 'เช่าเรือ · โปรแกรม 4 เกาะ',
      href: 'https://ทริปตรัง.com',
      img: IMG.tours[0],
    },
    {
      title: 'เกาะกระดาน',
      desc: 'ทัวร์เกาะกระดาน จ.ตรัง',
      href: 'https://เกาะกระดาน.com',
      img: IMG.tours[2],
    },
    {
      title: 'เช่าเรือตรัง',
      desc: 'จองเรือหางยาว / สปีดโบ๊ท',
      href: 'https://เช่าเรือตรัง.com',
      img: IMG.boats[0],
    },
  ];

  const POPULAR_TAGS = [
    { label: 'เกาะมุกต์', href: 'about.html' },
    { label: 'ที่พักเกาะมุกต์', href: 'hotels.html' },
    { label: 'ที่พักริมทะเล', href: 'hotels.html' },
    { label: 'โฮมสเตย์', href: 'hotels.html' },
    { label: 'แพ็คเกจทัวร์', href: 'programs.html' },
    { label: 'ดูพะยูน', href: 'about.html' },
    { label: 'ดำน้ำ', href: 'programs.html' },
    { label: 'ร้านอาหาร', href: 'restaurants.html' },
    { label: 'อาหารทะเล', href: 'restaurants.html' },
    { label: 'ตั๋วเรือ', href: 'boats.html' },
    { label: 'ทะเลตรัง', href: 'programs.html' },
    { label: 'วิถีชุมชน', href: 'about.html' },
  ];

  function popularTagsHtml() {
    return `<section class="popular-tags" aria-label="แท็กยอดนิยม">
      <h3 class="popular-tags__title">แท็กยอดนิยม</h3>
      <div class="popular-tags__list">
        ${POPULAR_TAGS.map((tag) => {
          const href = siteUrl(tag.href);
          return `<a class="popular-tags__tag" href="${escHtml(href)}">#${escHtml(tag.label)}</a>`;
        }).join('')}
      </div>
    </section>`;
  }

  function articleShareHtml(section, item) {
    const pageUrl = new URL(articleUrl(section, item._key, item.title), location.href).href;
    const encodedUrl = encodeURIComponent(pageUrl);
    const encodedTitle = encodeURIComponent(item.title || '');
    const line = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`;
    const twitter = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    return `<div class="article-share" role="group" aria-label="แชร์เรื่องนี้">
      <span class="article-share__label">แชร์เรื่องนี้</span>
      <div class="article-share__actions">
        <a class="article-share__icon article-share__icon--line" href="${escHtml(line)}" target="_blank" rel="noopener noreferrer" aria-label="แชร์ไลน์">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
        </a>
        <a class="article-share__icon article-share__icon--x" href="${escHtml(twitter)}" target="_blank" rel="noopener noreferrer" aria-label="แชร์ X">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a class="article-share__icon article-share__icon--fb" href="${escHtml(facebook)}" target="_blank" rel="noopener noreferrer" aria-label="แชร์ Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <button type="button" class="article-share__copy" data-copy-url="${escHtml(pageUrl)}" aria-label="Copy link">
          <span class="article-share__copy-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
          </span>
          Copy link
        </button>
      </div>
    </div>`;
  }

  function initArticleShareCopy() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy-url]');
      if (!btn) return;
      const url = btn.dataset.copyUrl;
      if (!url) return;
      const label = btn.querySelector('.article-share__copy-text') || btn;
      const fallback = btn.innerHTML;
      const done = () => {
        btn.innerHTML = '<span class="article-share__copy-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span><span class="article-share__copy-text">Copied!</span>';
        setTimeout(() => { btn.innerHTML = fallback; }, 2000);
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => {});
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch { /* ignore */ }
        document.body.removeChild(ta);
      }
    });
  }
  initArticleShareCopy();

  function pickRelated(section, excludeId, limit = 3) {
    const list = contentRegistry[section] || [];
    return list.filter((it) => it._key !== String(excludeId)).slice(0, limit);
  }

  function railItemHtml(section, item) {
    const kicker = CONTENT_SECTION_LABELS[section] || '';
    const extra = item.price
      ? `<span class="content-rail__price">THB ${escHtml(item.price)}</span>`
      : '';
    return `<a class="content-rail__item" href="${articleUrl(section, item._key, item.title)}">
      <img src="${escHtml(item._image || item.image || '')}" alt="" loading="lazy" decoding="async">
      <span class="content-rail__copy">
        <span class="content-rail__kicker">${escHtml(kicker)}</span>
        <span class="content-rail__name">${escHtml(item.title)}</span>
        ${extra}
      </span>
    </a>`;
  }

  function railGroupHtml(title, itemsHtml) {
    if (!itemsHtml) return '';
    return `<section class="content-rail__group">
      <h3 class="content-rail__title">${escHtml(title)}</h3>
      ${itemsHtml}
    </section>`;
  }

  function buildContentRailHtml(section, currentId) {
    const moreSame = pickRelated(section, currentId, 3);
    const tours = pickRelated('tour', section === 'tour' ? currentId : '', 3);
    const foods = pickRelated('restaurant', section === 'restaurant' ? currentId : '', 3);
    const highlights = pickRelated('activity', section === 'activity' ? currentId : '', 3);

    let html = '<aside class="content-rail" aria-label="เนื้อหาแนะนำ">';

    if (section !== 'tour' && tours.length) {
      html += railGroupHtml('แพ็คเกจทัวร์', tours.map((it) => railItemHtml('tour', it)).join(''));
    }
    if (moreSame.length && section !== 'tour') {
      html += railGroupHtml(`อ่านต่อ · ${CONTENT_SECTION_LABELS[section] || 'แนะนำ'}`, moreSame.map((it) => railItemHtml(section, it)).join(''));
    }
    if (section === 'tour' && tours.length) {
      html += railGroupHtml('แพ็คเกจอื่น', tours.map((it) => railItemHtml('tour', it)).join(''));
    }
    if (section !== 'restaurant' && foods.length) {
      html += railGroupHtml('ร้านอาหาร', foods.map((it) => railItemHtml('restaurant', it)).join(''));
    }
    if (section !== 'activity' && highlights.length) {
      html += railGroupHtml('ไฮไลต์', highlights.map((it) => railItemHtml('activity', it)).join(''));
    }

    html += `<section class="content-rail__group">
      <h3 class="content-rail__title">เว็บในเครือ</h3>
      ${NETWORK_SITES.map((site) => `<a class="content-rail__item content-rail__item--ext" href="${escHtml(site.href)}" target="_blank" rel="noopener">
        <img src="${escHtml(site.img)}" alt="" loading="lazy" decoding="async">
        <span class="content-rail__copy">
          <span class="content-rail__kicker">ทะเลตรัง</span>
          <span class="content-rail__name">${escHtml(site.title)}</span>
          <span class="content-rail__meta">${escHtml(site.desc)}</span>
        </span>
      </a>`).join('')}
    </section>`;

    html += popularTagsHtml();
    html += '</aside>';
    return html;
  }

  function paragraphsHtml(text) {
    return String(text || '')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p class="content-modal__desc">${escHtml(p)}</p>`)
      .join('');
  }

  function articlePointsHtml(points) {
    if (!points?.length) return '';
    return `<ul class="content-modal__points">${points.map((p) => `<li>${escHtml(p)}</li>`).join('')}</ul>`;
  }

  const ARTICLE_STORIES = {
    activity: [
      {
        paragraphs: [
          'พะยูนอันดามัน เป็นสัญลักษณ์สำคัญของเกาะมุกต์ จังหวัดตรัง สัตว์เลี้ยงลูกด้วยนมในทะเลที่หายากและใกล้สูญพันธุ์ บนเกาะมุกต์มีแหล่งอนุรักษ์และจุดสังเกตพะยูนหลายแห่ง โดยเฉพาะบริเวณหญ้าทะเลและปากน้ำที่พะยูนมาเลียแหล่งอาหาร',
          'การดูพะยูนที่ดีที่สุดคือช่วงเช้าตรู่หรือเช้า ๆ เมื่อทะเลสงบและพะยูนมักโผล่ขึ้นมาหายใจ แนะนำให้นั่งเรือหางยาวพร้อมไกด์ท้องถิ่นที่รู้จักพฤติกรรมสัตว์ ไม่รบกวนด้วยเสียงดัง ไม่ให้อาหาร และรักษาระยะห่างอย่างน้อย 30 เมตรตามหลักการอนุรักษ์',
          'ระหว่างล่องเรือจะได้เห็นป่าชายเลนสีเขียว หญ้าทะเลผืนใหญ่ และวิถีชีวิตชาวประมงที่ออกเรือตั้งแต่โพล้เช้า บางทริปแวะจุดถ่ายรูปวิวเกาะและอธิบายประวัติชุมชนมุสลิมบนเกาะ ซึ่งอยู่ร่วมกับธรรมชาติมานานหลายชั่วอายุคน',
          'เกาะมุกต์เข้าถึงได้โดยเรือจากท่าเรือหาดยาว อ.กันตัง ใช้เวลาข้ามประมาณ 45 นาที–1 ชั่วโมง ควรจองทัวร์หรือเหมาเรือล่วงหน้า โดยเฉพาะช่วงปิดเทอมและวันหยุดยาว ที่พักบนเกาะมีจำกัด แนะนำเช็คที่พักและรอบเรือกลับให้เรียบร้อยก่อนออกเดินทาง',
        ],
        points: ['เหมาะกับทุกวัย', 'ควรออกเช้าเพื่อโอกาสเจอพะยูนมากขึ้น', 'ห้ามรบกวนหรือให้อาหารพะยูน', 'ใส่เสื้อชูชีพตลอดการเดินทาง'],
      },
      {
        paragraphs: [
          'ป่าชายเลนรอบเกาะมุกต์เป็นป่าโกงกางที่ยังคงความอุดมสมบูรณ์ มีระบบนิเวศเชื่อมต่อระหว่างป่า น้ำ และทะเล การล่องเรือชมป่าชายเลนเป็นกิจกรรมยอดนิยมที่ไม่ต้องใช้แรงมาก เหมาะกับครอบครัวและผู้สูงอายุ',
          'เรือจะค่อย ๆ แล่นผ่านคลองแคบ ๆ ใต้ร่มไม้ใหญ่ มองเห็นรากโกงกางที่ยื่นจากน้ำ นกนางนวล นกกระสา และสัตว์น้ำขนาดเล็กที่อาศัยอยู่ในโคลนและรากไม้ บางช่วงอากาศเงียบสงบจนได้ยินเสียงน้ำกระทบเรือและลมพัดผ่านใบโกงกาง',
          'หญ้าทะเล (Seagrass) ที่ขึ้นรอบเกาะเป็นแหล่งอาหารสำคัญของพะยูน นักท่องเที่ยวที่มาในช่วงน้ำลงบางครั้งจะเห็นทุ่งหญ้าทะเลโผล่พ้นน้ำเป็นผืนเขียวกว้าง เป็นภาพที่หาได้ยากในหลายเกาะอื่น ๆ ของไทย',
          'ทริปล่องเรือชมป่าชายเลนใช้เวลาประมาณ 1–2 ชั่วโมง สามารถรวมกับทัวร์ดูพะยูนหรือแวะร้านอาหารพื้นบ้านในชุมชนได้ แนะนำพกหมวก ครีมกันแดด และน้ำดื่ม บางรอบเรือมีไกด์อธิบายภาษาไทยตลอดทาง',
        ],
        points: ['เหมาะกับครอบครัว', 'ใช้เวลา 1–2 ชั่วโมง', 'แนะนำช่วงเช้า–สาย', 'สวมหมวกและครีมกันแดด'],
      },
      {
        paragraphs: [
          'แหลมจุโหย จุดชมพระอาทิตย์ตกที่โด่งดังที่สุดบนเกาะมุกต์ ตั้งอยู่ปลายแหลมยื่นออกสู่ทะเลอันดามัน วิวทะเลกว้าง ท้องฟ้าเปลี่ยนสี และลมทะเลพัดเบา ๆ ทำให้ที่นี่เป็นจุดโรแมนติกที่คู่รักและนักถ่ายภาพนิยมมา',
          'ช่วงเย็นก่อนพระอาทิตย์ตกประมาณ 1 ชั่วโมง จะเริ่มมีนักท่องเที่ยวมารอจับภาพ แนะนำมาถึงก่อนเวลาเพื่อหามุมถ่ายรูปและที่นั่ง บางโฮมสเตย์และรีสอร์ทใกล้แหลมจุโหยเดินถึงจุดชมวิวได้ในไม่กี่นาที',
          'นอกจากพระอาทิตย์ตกแล้ว ยังมองเห็นเกาะเล็กรอบ ๆ และเส้นขอบฟ้าของฝั่งตรัง บางวันท้องฟ้าแจ่มใส เห็นสีส้ม–ชมพู–ม่วงไล่เฉดสวยงามมาก เป็นช่วงเวลาที่ชาวเกาะนิยมพาคนมาเที่ยวและเล่าเรื่องประวัติชุมชน',
          'การเดินทางไปแหลมจุโหยทำได้โดยรถมอเตอร์ไซค์หรือจักรยานจากบ้านพร้าว ระยะทางไม่ไกล แต่ควรระวังแสงแดดและเตรียมไฟฉายถ้าจะเดินกลับหลังมืด ไม่มีร้านสะดวกซื้อใกล้ ๆ ควรพกน้ำและขนมไปเอง',
        ],
        points: ['ช่วงเวลาดีที่สุด 17:00–19:00 น.', 'เหมาะถ่ายรูปและพักผ่อน', 'เดินทางจากบ้านพร้าวสะดวก', 'พกน้ำดื่มและครีมกันแดด'],
      },
      {
        paragraphs: [
          'เกาะมุกต์เป็นชุมชนมุสลิมที่ยังรักษาวิถีชีวิตดั้งเดิมไว้ได้ดี บ้านเรือนไม้ มัสยิด เรือประมง และร้านอาหารพื้นบ้านเรียงรายตามถนนชายเกาะ การเดินเที่ยวชุมชนเป็นการสัมผัสวัฒนธรรมที่แตกต่างจากเกาะท่องเที่ยวทั่วไป',
          'อาหารพื้นบ้านบนเกาะเน้นวัตถุดิบทะเลสด ข้าวยำ แกงไตปลา แกงส้ม และของหวานพื้นบ้าน รสชาติจัดจ้านแบบใต้แท้ ๆ แต่ไม่แพง หลายร้านเปิดเฉพาะช่วงมื้อเช้า–เย็น และหยุดวันศุกร์ตามประเพณี',
          'ชาวบ้านอัธยาศัยดี ยิ้มทักทายนักท่องเที่ยว บางครั้งมีการสาธิตทำอาหารหรือพาเที่ยวสวนผลไม้หลังบ้าน หากต้องการประสบการณ์ลึกขึ้น แนะนำพักโฮมสเตย์ที่เจ้าของบ้านเลี้ยงอาหารเช้าแบบพื้นบ้าน',
          'เวลาเดินชมชุมชนควรแต่งกายสุภาพ ถอดรองเท้าเมื่อเข้าบ้านหรือมัสยิด และเคารพเวลาละหมาด การเที่ยวแบบนี้เหมาะกับผู้ที่อยากเรียนรู้วิถีชีวิตจริง ไม่ใช่แค่ถ่ายรูปแล้วกลับ',
        ],
        points: ['แต่งกายสุภาพ', 'เคารพวัฒนธรรมมุสลิม', 'ลองอาหารพื้นบ้านริมทะเล', 'เหมาะเดินเที่ยวช้า ๆ'],
      },
      {
        paragraphs: [
          'น้ำรอบเกาะมุกต์ใสมองเห็นพื้นทรายและปะการังตื้นได้ในแหล่งดำน้ำหลายจุด ไม่จำเป็นต้องมีใบดำน้ำลึก แค่ใส่หน้ากากและท่อหายใจก็สนุกได้ทั้งครอบครัว อุปกรณ์ให้เช่าได้ที่ท่าเรือหรือร้านทัวร์',
          'จุดดำน้ำยอดนิยมอยู่บริเวณหน้าหาดและเกาะเล็กรอบมุกต์ ปลาเล็ก ปลาการ์ตูน และปะการังแข็ง–อ่อนผสมกัน ช่วงน้ำลงน้ำนิ่ง เหมาะมากสำหรับผู้เริ่มต้น ควรสวมเสื้อชูชีพและไม่เหยียบปะการัง',
          'ทัวร์ดำน้ำตื้นมักรวมกับดูพะยูน ล่องเรือ หรือแวะเกาะใกล้เคียง ใช้เวลาครึ่งวันถึงหนึ่งวัน ไกด์จะพาไปจุดที่ปลอดภัยและอธิบายสิ่งที่เห็นใต้น้ำ รวมอุปกรณ์และเสื้อชูชีพในราคาแพ็คเกจ',
          'แนะนำพกครีมกันแดดที่เป็นมิตรต่อปะการัง รองเท้าเล่นน้ำ และผ้าเช็ดตัว ถ่ายรูปใต้น้ำได้ด้วยกล้องกันน้ำหรือมือถือใส่ถุงกันน้ำ แต่ควรดูแลไม่ให้กระแทกปะการัง',
        ],
        points: ['เหมาะครอบครัวและมือใหม่', 'มีอุปกรณ์ให้เช่า', 'ห้ามเหยียบปะการัง', 'ใส่ครีมกันแดดที่ปลอดภัยต่อทะเล'],
      },
      {
        paragraphs: [
          'ตกหมึกยามค่ำคืนเป็นกิจกรรมสุดฮิตบนเกาะมุกต์ เรือออกเมื่อฟ้ามืด ใช้ไฟล่อหมึกที่มักโผล่ใกล้ผิวน้ำ ความตื่นเต้นของการรอจังหวะกดและดึงหมึกขึ้นเรือทำให้หลายคนติดใจและอยากมาซ้ำ',
          'ไม่จำเป็นต้องมีประสบการณ์มาก่อน ลูกเรือและคนขับเรือจะสอนวิธีจับและรักษาความปลอดภัย หมึกที่ได้สดใหม่ นำไปทำเมนูย่างหรือผัดกะเพราได้ทันทีเมื่อกลับที่พัก หรือให้ร้านอาหารช่วยปรุง',
          'ทริปตกหมึกใช้เวลาประมาณ 2–3 ชั่วโมง รวมเวลาเดินทางไปจุดตก ควรใส่เสื้อกันหนาวบาง ๆ เพราะลมทะเลตอนกลางคืนเย็น และสวมรองเท้ากันลื่น บางทริปจำกัดจำนวนคนต่อลำเพื่อความปลอดภัย',
          'จองล่วงหน้าโดยเฉพาะช่วงวันหยุด บางแพ็คเกจรวมอาหารเย็นและเครื่องดื่มบนเรือ ถ้ามีอาการเมาเรือควรกินยาก่อนล่วงหน้าและเลือกเรือขนาดใหญ่ที่ทรงตัวดี',
        ],
        points: ['ออกเรือช่วง 18:00–21:00 น.', 'ไม่ต้องมีประสบการณ์', 'สวมเสื้อกันหนาวบาง ๆ', 'จองล่วงหน้าช่วงไฮซีซัน'],
      },
      {
        paragraphs: [
          'เกาะมุกต์มีถนนรอบเกาะไม่ยาว ปั่นจักรยานเที่ยวชมวิถีชีวิตและธรรมชาติได้ใน 2–3 ชั่วโมง อากาศสะอาด วิวทะเลเปิดระหว่างทาง บางช่วงผ่านสวนมะพร้าวและบ้านไม้ชายทะเล',
          'จักรยานเช่าได้ที่โฮมสเตย์และร้านใกล้ท่าเรือ ราคาไม่แพง บางที่พักให้ยืมฟรีสำหรับลูกค้า แนะนำออกปั่นตอนเช้าหรือเย็น หลีกเลี่ยงแดดจัดช่วงเที่ยง',
          'เส้นทางส่วนใหญ่เรียบ ไม่ชัน แต่ควรระวังรถและรถมอเตอร์ไซค์ท้องถิ่น แวะพักดื่มน้ำมะพร้าวริมทาง ถ่ายรูปวิวและมัสยิดเก่า สัมผัสบรรยากาศที่ไม่ได้มาจากรถทัวร์',
          'เหมาะกับนักท่องเที่ยวที่อยากเคลื่อนไหวและสำรวจด้วยตัวเอง สามารถแวะร้านอาหาร หาดเล็ก ๆ และจุดชมวิวระหว่างทางได้ตามใจ',
        ],
        points: ['ใช้เวลา 2–3 ชั่วโมง', 'เช่าจักรยานราคาถูก', 'ปั่นช่วงเช้า–เย็น', 'พกน้ำและหมวก'],
      },
      {
        paragraphs: [
          'โฮมสเตย์ริมทะเลบนเกาะมุกต์ให้ประสบการณ์พักผ่อนแบบใกล้ชิดธรรมชาติ หลายแห่งเป็นเรือนไม้ มีระเบียงมองทะเล ตื่นมาได้ยินเสียงคลื่น และกินอาหารเช้าที่เจ้าของบ้านทำเอง',
          'ห้องพักเรียบง่าย สะอาด มีพัดลมหรือแอร์ตามแต่ที่ ราคาต่อคืนหลักร้อยถึงพันกว่าบาท รวมอาหารเช้าบางแห่ง บรรยากาศเงียบสงบ เหมาะกับคนที่อยากหลีกหนีความวุ่นวาย',
          'เจ้าของโฮมสเตย์มักช่วยจัดเรือ จองทัวร์ และแนะนำร้านอาหาร ทำให้การวางแผนทริปง่ายขึ้น บางที่มีกิจกรรมพาไปดูพระอาทิตย์ตกหรือตกปลา',
          'ควรจองล่วงหน้า โดยเฉพาะวันหยุดและเทศกาล เช็คเรื่องไฟฟ้า อินเทอร์เน็ต และเวลาเรือกลับให้ชัด การพักโฮมสเตย์คือวิธีที่ดีที่สุดในการเข้าใจเกาะมุกต์อย่างแท้จริง',
        ],
        points: ['ราคาเป็นกันเอง', 'บรรยากาศสงบ', 'เจ้าของบ้านช่วยจัดทริป', 'จองล่วงหน้าช่วงไฮซีซัน'],
      },
    ],
    restaurant: [
      {
        paragraphs: [
          'ครัวเล มุกต์ ซีฟู้ด ร้านอาหารทะเลชื่อดังบนเกาะมุกต์ เน้นวัตถุดิบสดจากเรือประมงที่จอดท่าในวันนั้น ๆ ปลา กุ้ง ปู และหอยนำมาปรุงทันที รสชาติหวานเป็นธรรมชาติ ไม่ต้องปรุงรสจัดจ้าน',
          'เมนูแนะนำ ได้แก่ กุ้งเผา ปลากะพงทอดน้ำปลา หอยลายผัดใบโหระพา และแกงส้มปลา ราคาต่อจานเป็นกันเองเมื่อเทียบกับเกาะท่องเที่ยวอื่น บางโต๊ะนั่งริมทะเล มองเห็นเรือและพระอาทิตย์ตกได้',
          'ร้านเปิดตั้งแต่เช้าถึงค่ำ มื้อเที่ยงและเย็นมักคนเยอะ แนะนำมาก่อน 11:30 น. หรือจองโต๊ะล่วงหน้าถ้ามาเป็นกรุ๊ป บริการเป็นกันเอง เหมือนกินข้าวที่บ้านญาติ',
          'ถ้ามาเที่ยวเกาะมุกต์และอยากกินทะเลสดจริง ๆ ครัวเลคือจุดแรกที่คนท้องถิ่นแนะนำ สามารถสั่งเมนูตามงบและจำนวนคนได้ ทีมงานเกาะมุกต์.com ช่วยจัดแพ็คเกจอาหารพร้อมทัวร์ได้',
        ],
        points: ['วัตถุดิบสดทุกวัน', 'มีที่นั่งริมทะเล', 'ราคาชาวบ้าน', 'เหมาะกับครอบครัวและกรุ๊ป'],
      },
      {
        paragraphs: [
          'ร้านป้าแดง ขึ้นชื่อเรื่องข้าวยำปักษ์ใต้และน้ำบูดูสูตรต้นตำรับ ข้าวยำที่นี่มีเครื่องเคียงครบ ผักสด ไขเจียว ปลาแห้ง และน้ำจิ้มรสกลมกล่อม เป็นรสที่หาได้ยากนอกเกาะ',
          'น้ำบูดูของร้านหมักเอง หอม ไม่คาวเกินไป ใช้กับผักสดหรือทอดมันได้อร่อยทั้งคู่ ลูกค้าประจำมักสั่งข้าวยำพร้อมแกงไตปลาหรือไก่ต้มโล่ง',
          'ร้านอยู่ในชุมชน บรรยากาศเรียบง่าย ราคาไม่แพง เหมาะกับมื้อเที่ยงหลังล่องเรือหรือดูพะยูน เปิดเฉพาะบางวัน ควรโทรถามก่อนหรือให้โฮมสเตย์ช่วยนัด',
          'การได้ลองข้าวยำแท้ ๆ บนเกาะมุกต์เป็นอีกหนึ่งประสบการณ์วัฒนธรรม ที่เติมเต็มทริปทะเลให้สมบูรณ์',
        ],
        points: ['ข้าวยำและน้ำบูดูเด็ด', 'ราคาประหยัด', 'บรรยากาศชุมชน', 'แนะนำโทรถามเวลาเปิด'],
      },
      {
        paragraphs: [
          'ลานเล คาเฟ่ ริมทะเล จุดพักคอย่างชิล ๆ บนเกาะมุกต์ มีกาแฟสด ชา น้ำผลไม้ และของหวาน นั่งมองทะเล ฟังเสียงคลื่น ถ่ายรูปวิวสวยได้ไม่รู้เบื่อ',
          'บรรยากาะโปร่ง โต๊ะเรียงริมระเบียง ลมทะเลพัดสบาย เหมาะกับช่วงบ่ายหลังเที่ยว หรือเช้าวันใหม่ก่อนออกทัวร์ มีขนมพื้นบ้านบางเมนูตามฤดูกาล',
          'ราคากาแฟและเครื่องดื่มอยู่ในระดับที่ยอมรับได้ ไม่แพงอย่างรีสอร์ทใหญ่ บางครั้งมีดนตรีสดหรือกิจกรรมชุมชน',
          'ถ้าไม่อยากกินอาหารทะเลทุกมื้อ ลานเลเป็นทางเลือกที่ดีสำหรับเบรกและพักใจ',
        ],
        points: ['วิวทะเลสวย', 'กาแฟและของหวาน', 'บรรยากาศชิล', 'เหมาะพักบ่าย'],
      },
      {
        paragraphs: [
          'ครัวบ้านพร้าว ร้านอาหารที่คนท้องถิ่นแนะนำเรื่องปูม้านึ่งและกุ้งเผา ปูสดนึ่งเนื้อแน่น กุ้งแดงใหญ่ ราคาคิดตามน้ำหนักจริง ไม่มีค่าแอบแฝง',
          'นอกจากอาหารทะเลแล้ว ยังมีผัดกะเพรา ต้มยำ และผักสดจากสวนชุมชน รสจัดจ้านแบบใต้ ทานคู่ข้าวสวยร้อน ๆ ได้อย่างอร่อย',
          'ร้านอยู่ใกล้ท่าเรือบ้านพร้าว สะดวกสำหรับนักท่องเที่ยวที่เพิ่งลงเรือ หรือก่อนขึ้นเรือกลับ มื้อเที่ยงมักมีคนเยอะ แต่จัดโต๊ะได้เร็ว',
          'ถ้าอยากกินปูม้าและกุ้งเผาราคาชาวบ้าน ครัวบ้านพร้าวคือคำตอบ แนะนำมาก่อน 11:30 น. หรือ 17:30 น.',
        ],
        points: ['ปูม้านึ่งและกุ้งเผาเด่น', 'คิดราคาตามน้ำหนัก', 'ใกล้ท่าเรือ', 'รสจัดจ้านแบบใต้'],
      },
      {
        paragraphs: [
          'ร้านลุงหมึก ปลาหมึกย่างสดใหม่ทุกวัน เนื้อหนึบหอมกลิ่นเตาถ่าน เสิร์ฟพร้อมน้ำจิ้มรสเปรี้ยวหวานและผักสด เป็นเมนูที่ต้องลองเมื่อมาเกาะมุกต์',
          'หมึกสดจากเรือประมง ย่างไม่แห้งเกินไป กินกับข้าวเหนียวหรือข้าวสวยได้อร่อย บางวันมีปลาหมึกไข่หรือเมนูพิเศษตามฤดู',
          'ร้านเล็ก บรรยากาศอบอุ่น ราคาไม่แพง เหมาะกับมื้อเย็นหลังตกหมึกหรือล่องเรือ ลุงเจ้าของร้านมักเล่าเรื่องการประมงให้ฟัง',
          'ถ้าชอบอาหารทะเลแบบเรียบง่ายแต่อร่อย ร้านลุงหมึกตอบโจทย์ แนะนำสั่งล่วงหน้าถ้ามาเป็นกรุ๊ปใหญ่',
        ],
        points: ['ปลาหมึกย่างสด', 'ราคาเป็นกันเอง', 'บรรยากาศอบอุ่น', 'เหมาะมื้อเย็น'],
      },
      {
        paragraphs: [
          'ครัวยายแป้น ร้านแกงส้มปลากะพงที่คนพื้นที่ยกนิ้วให้ น้ำแกงเปรี้ยวเผ็ดกำลังดี ปลาสดไม่คาว ผักรวมในแกงหอมกรุ่น กินกับข้าวสวยร้อน ๆ คือความฟินของคนรักอาหารใต้',
          'นอกจากแกงส้ม ยังมีแกงไตปลา ผัดสะตอ และอาหารจานเดียวอื่น ๆ ราคาถูก ปริมาณจานใหญ่ เหมาะแชร์กิน',
          'ร้านอยู่ในซอยชุมชน หาที่จอดรถมอเตอร์ไซค์ได้ เปิดช่วงมื้อกลางวันเป็นหลัก บางวันหมดเร็วถ้าวัตถุดิบหมด',
          'แกงส้มยายแป้นเป็นเมนูที่ทำให้รู้ว่าอาหารใต้แท้ ๆ บนเกาะมุกต์เป็นอย่างไร ไม่ควรพลาดถ้ามาเที่ยวเกาะ',
        ],
        points: ['แกงส้มปลากะพงเด็ด', 'จานใหญ่ราคาถูก', 'เปิดมื้อกลางวัน', 'รสแท้แบบใต้'],
      },
      {
        paragraphs: [
          'ซีฟู้ดบ้านบาตู ร้านอาหารทะเลสไตล์ออส่วน หอยนางรมสด กุ้งก้ามกราม และเมนูทะเลหลากหลาย จัดจานสวย ปริมาณพอเหมาะสำหรับแชร์',
          'เหมาะกับกรุ๊ปเพื่อนหรือครอบครัวที่อยากลองหลายเมนู สั่งปูนิ่ม หอยแมลงภู่ ปลาทูน่าย่าง และสลัดทะเลได้ในครั้งเดียว',
          'ราคาอยู่ในระดับกลาง ๆ ไม่แพงอย่างรีสอร์ทหรู บริการเป็นกันเอง มีที่นั่งในร่มและกลางแจ้ง',
          'ถ้าอยากได้มื้อพิเศษทะเลครบเครื่อง ซีฟู้ดบ้านบาตูเป็นตัวเลือกที่ดี แนะนำจองโต๊ะล่วงหน้าช่วงวันหยุด',
        ],
        points: ['อาหารทะเลหลากเมนู', 'เหมาะกรุ๊ป', 'หอยนางรมสด', 'จองล่วงหน้าวันหยุด'],
      },
      {
        paragraphs: [
          'ครัวมุกต์วิว ร้านอาหารใต้ที่มีจุดเด่นคือวิวทะเลพาโนรามา นั่งทานข้าวมองเกลียวคลื่นและท้องฟ้ากว้าง บรรยากาศโรแมนติก โดยเฉพาะช่วงเย็น',
          'เมนูครบทั้งอาหารทะเลและอาหารพื้นบ้าน แกง ผัด ยำ และเครื่องดื่มเย็น ราคาสูงกว่าร้านในชุมชนเล็กน้อย แต่แลกกับวิวและความสะดวก',
          'เหมาะกับคู่รักและครอบครัวที่อยากได้มื้อพิเศษ มีที่จอดรถและรับจองโต๊ะริมระเบียง แนะนำมาก่อนพระอาทิตย์ตกเพื่อจองที่นั่งดี ๆ',
          'ครัวมุกต์วิวเป็นการปิดท้ายทริปด้วยมื้ออาหารใต้ริมทะเลที่ประทับใจ',
        ],
        points: ['วิวทะเลพาโนรามา', 'เมนูครบ', 'เหมาะมื้อเย็น', 'จองโต๊ะริมระเบียง'],
      },
    ],
    tour: [
      {
        paragraphs: [
          'โปรแกรม 4 เกาะ ทะเลตรัง ครอบคลุมเกาะมุก ถ้ำมรกต เกาะกระดาน และจุดแวะสวย ๆ อื่น ๆ เป็นแพ็คเกจยอดนิยมสำหรับผู้ที่อยากเห็นทะเลตรังครบในวันเดียว',
          'ออกเรือจากท่าเรือหาดยาวช่วงเช้า มีอาหารกลางวัน อุปกรณ์ดำน้ำตื้น และไกด์ดูแลตลอดทาง แต่ละเกาะมีเวลาแวะพอให้ถ่ายรูป เล่นน้ำ และพักผ่อน',
          'ถ้ำมรกตน้ำใสมองเห็นพื้นทราย เกาะกระดานมีหาดทรายขาวและจุดดำน้ำ เกาะมุกเงียบสงบ แต่ละจุดมีเอกลักษณ์ ไม่รีบร้อน ไม่ยัดเยียดร้านค้า',
          'ราคาต่อท่านรวมเรือ ไกด์ และอาหาร จองล่วงหน้าเพื่อล็อกที่นั่ง โดยเฉพาะช่วงปิดเทอม ทีมงานเกาะมุกต์.com ช่วยจัดรถรับ–ส่งและที่พักร่วมได้',
        ],
        points: ['ครบ 4 เกาะในวันเดียว', 'รวมอาหารกลางวัน', 'ไกด์ดูแลตลอดทาง', 'จองล่วงหน้าช่วงไฮซีซัน'],
      },
      {
        paragraphs: [
          'ทัวร์เกาะกระดานเน้นดำน้ำดูปะการังและชมหาดทรายขาว น้ำใส เหมาะกับคนรักทะเลและการถ่ายภาพ ใช้เวลาเต็มวันหรือครึ่งวันตามแพ็คเกจ',
          'มีจุดดำน้ำหลายแห่ง ปลาเล็กปลาใหญ่หลากสี ปะการังแข็งและอ่อน ไกด์จะพาไปจุดที่ปลอดภัยและสวยที่สุดในวันนั้น',
          'บางแพ็คเกจรวมอาหารกลางวันและอุปกรณ์ครบ ไม่ต้องเตรียมเอง แนะนำใส่ครีมกันแดดและเสื้อชูชีพตลอดการเดินทาง',
          'เกาะกระดานอยู่ไม่ไกลจากเกาะมุกต์ สามารถจัดเป็นทริปต่อเนื่องหรือมาเที่ยวเฉพาะวันได้',
        ],
        points: ['เน้นดำน้ำและชมหาด', 'น้ำใสมองเห็นปะการัง', 'มีอุปกรณ์ให้', 'เหมาะคนรักทะเล'],
      },
      {
        paragraphs: [
          'โปรแกรมดำน้ำลึกเกาะมุกต์ สำหรับผู้ที่มีใบดำน้ำหรืออยากดำน้ำแบบมีไกด์ ครอบคลุมจุดใต้น้ำรอบเกาะและเกาะเล็กใกล้เคียง',
          'น้ำใสในบางฤดูกาลมองเห็นได้ไกล ปลาเขตร้อนและแนวปะการังหลากหลาย ทีมงานดูแลความปลอดภัยและอุปกรณ์ครบ',
          'ต้องมีสุขภาพแข็งแรงและไม่มีปัญหาเรื่องแรงดันหรือหู สำหรับมือใหม่มีทริปดำน้ำตื้นทางเลือก แพ็คเกจนี้เหมาะกับผู้มีประสบการณ์หรืออยากเรียนดำน้ำ',
          'จองล่วงหน้าและแจ้งระดับประสบการณ์ เพื่อจัดไกด์และจุดดำน้ำให้เหมาะสม',
        ],
        points: ['ต้องมีใบดำน้ำหรือประสบการณ์', 'อุปกรณ์ครบ', 'ไกด์ดำน้ำมืออาชีพ', 'จองและแจ้งระดับล่วงหน้า'],
      },
      {
        paragraphs: [
          'ทัวร์เกาะมุกและถ้ำมรกต รวมสองไฮไลต์ของทะเลตรัง เกาะมุกเงียบสงบ ถ้ำมรกตน้ำใสเห็นพื้นทรายและเรือด้านบน',
          'เรือออกเช้า แวะเกาะมุกให้เวลาพักผ่อน จากนั้นไปถ้ำมรกตเล่นน้ำและถ่ายรูป มีอาหารกลางวันและเครื่องดื่ม',
          'เหมาะกับครอบครัวและกลุ่มเพื่อน ไม่ต้องดำน้ำลึกก็สนุกได้ แค่ลอยตัวและมองเห็นความงามใต้น้ำ',
          'ราคารวมเรือและไกด์ แนะนำจองล่วงหน้าและเช็คสภาพอากาศ ถ้ามีคลื่นแรงอาจปรับเส้นทาง',
        ],
        points: ['เกาะมุก + ถ้ำมรกต', 'เหมาะครอบครัว', 'รวมอาหารกลางวัน', 'เช็คสภาพอากาศก่อนออก'],
      },
      {
        paragraphs: [
          'โปรแกรมชมพะยูนเกาะมุกต์ ออกแบบมาเพื่อดูพะยูนโดยเฉพาะ เรือพาไปจุดที่พะยูนมักมาเลียหญ้าทะเล พร้อมไกด์อธิบายพฤติกรรมและการอนุรักษ์',
          'มักออกช่วงเช้าเมื่อทะเลสงบ มีโอกาสเห็นพะยูนโผล่หายใจสูง บางทริปรวมล่องชมป่าชายเลนและอาหารกลางวัน',
          'ห้ามรบกวนพะยูน ไม่ให้อาหาร และรักษาระยะห่าง เป็นการท่องเที่ยวเชิงอนุรักษ์ที่ช่วยให้คนรุ่นหลังยังได้เห็นพะยูน',
          'ราคาต่อท่านรวมเรือและไกด์ จองผ่านเกาะมุกต์.com ได้ตลอด',
        ],
        points: ['ออกเช้าโอกาสเจอสูง', 'ไกด์อธิบายการอนุรักษ์', 'ห้ามรบกวนพะยูน', 'รวมเรือและไกด์'],
      },
      {
        paragraphs: [
          'ทัวร์ตกหมึกยามค่ำคืน เรือออกเมื่อฟ้ามืด ใช้ไฟล่อหมึก สนุกและตื่นเต้น เหมาะกับกลุ่มเพื่อนและครอบครัวที่อยากลองประสบการณ์ใหม่',
          'ไม่ต้องมีประสบการณ์ ลูกเรือสอนวิธีจับ หมึกสดนำไปปรุงได้เมื่อกลับ บางแพ็คเกจรวมอาหารเย็นบนเรือ',
          'ใช้เวลา 2–3 ชั่วโมง สวมเสื้อกันหนาวบาง ๆ และรองเท้ากันลื่น จองล่วงหน้าโดยเฉพาะวันหยุด',
          'เป็นหนึ่งในกิจกรรมที่ทำให้ทริปเกาะมุกต์น่าจดจำ',
        ],
        points: ['ออกกลางคืน', 'ไม่ต้องมีประสบการณ์', 'สวมเสื้อกันหนาว', 'จองล่วงหน้า'],
      },
      {
        paragraphs: [
          'ล่องเรือชมป่าชายเลน เน้นธรรมชาติและความเงียบสงบ เรือแล่นช้า ๆ ในคลองใต้ร่มโกงกาง มองเห็นหญ้าทะเลและนกน้ำ',
          'เหมาะกับผู้สูงอายุและครอบครัว ไม่ต้องลงน้ำ แค่นั่งชมวิวและฟังไกด์เล่าเรื่องระบบนิเวศ ใช้เวลาประมาณ 1–2 ชั่วโมง',
          'บางทริปจับคู่กับดูพะยูนหรือแวะชุมชน ราคาไม่แพง เป็นทางเลือกที่ผ่อนคลาย',
          'แนะนำช่วงเช้าหรือเย็น อากาศไม่ร้อนจัด',
        ],
        points: ['เหมาะทุกวัย', 'ไม่ต้องลงน้ำ', 'ใช้เวลา 1–2 ชม.', 'ราคาไม่แพง'],
      },
      {
        paragraphs: [
          'เหมาลำเรือส่วนตัว 1 วัน จัดเส้นทางเองได้ ครอบครัวหรือกลุ่มเพื่อน ไม่ต้องแชร์เรือกับคนอื่น ยืดหยุ่นเรื่องเวลาแวะและเมนูอาหาร',
          'เลือกได้ว่าจะเน้นดูพะยูน ดำน้ำ ตกหมึก หรือล่องชมป่าชายเลน ทีมงานช่วยวางแผนตามงบและจำนวนคน',
          'ราคาต่อลำ แบ่งกันหลายคนคุ้มกว่าเรือรวม มีเสื้อชูชีพและอุปกรณ์ความปลอดภัยครบ',
          'จองล่วงหน้าอย่างน้อย 3–7 วัน โดยเฉพาะช่วงเทศกาล',
        ],
        points: ['เส้นทางยืดหยุ่น', 'ไม่แชร์เรือ', 'เหมาะกรุ๊ปใหญ่', 'จองล่วงหน้า 3–7 วัน'],
      },
    ],
  };

  function fallbackArticle(section, item) {
    const title = item.title || '';
    const stories = {
      activity: {
        lead: `${title} เป็นไฮไลต์ที่นักท่องเที่ยวไม่ควรพลาดเมื่อมาเกาะมุกต์ จังหวัดตรัง — เกาะที่ยังคงวิถีชุมชนและความเป็นธรรมชาติของทะเลอันดามันไว้ได้อย่างแท้จริง`,
        body: 'แนะนำให้ออกเช้าเพื่อแสงสวยและทะเลสงบ เรือออกจากท่าเรือหาดยาวหรือท่าเรือบ้านพร้าวตามรอบ ระหว่างทางจะเห็นป่าชายเลน หญ้าทะเล และวิถีชาวประมงพื้นบ้าน',
        close: 'จัดทริปง่ายทั้งครอบครัวและกลุ่มเพื่อน หากต้องการไกด์ท้องถิ่นหรือเหมาเรือส่วนตัว ติดต่อทีมงานเกาะมุกต์.com ได้ตลอดวันทำการ',
        points: ['เหมาะกับทุกวัย', 'ใช้เวลาประมาณครึ่งวันถึงหนึ่งวัน', 'ควรพกร่มกันแดด หมวก และเสื้อชูชีพ'],
      },
      hotel_mini: {
        lead: `${title} รวบรวมที่พักบนเกาะมุกต์ที่เดินถึงชายหาดได้จริง ทั้งโฮมสเตย์วิถีชุมชน บังกะโลริมเล และรีสอร์ทเงียบสงบ วิวทะเลอันดามันเปิดกว้างตั้งแต่ระเบียงห้อง`,
        body: 'ห้องพักบนเกาะมีไม่มาก โดยเฉพาะช่วงวันหยุดและวันหยุดยาว ควรจองล่วงหน้าอย่างน้อย 3–7 วัน เลือกโซนบ้านพร้าวถ้าอยากใกล้ท่าเรือ หรือแหลมจุโหยถ้าอยากชมพระอาทิตย์ตกแบบส่วนตัว',
        close: 'ราคาเริ่มต้นประมาณหลักร้อยถึงหลักพันตามประเภทที่พัก หลายแห่งรวมอาหารเช้าแบบพื้นบ้าน ค่าเรือข้ามฝากคิดแยกต่างหาก ทีมงานช่วยจองที่พักและตั๋วเรือให้ในครั้งเดียวได้',
        points: ['ใกล้ชายหาด เดินถึงทะเลได้', 'บรรยากาศสงบ ไม่พลุกพล่าน', 'เหมาะกับครอบครัวและคู่รัก', 'จองล่วงหน้าช่วงไฮซีซัน'],
      },
      restaurant: {
        lead: `${title} เป็นร้านที่คนท้องถิ่นและนักท่องเที่ยวนิยมแวะ เพราะวัตถุดิบขึ้นจากเรือประมงเกาะมุกต์ในวันนั้น รสชาติอาหารใต้ชัดเจน ไม่จัดจ้านเกินจนกินไม่หมด`,
        body: 'เมนูเด่นมักเป็นอาหารทะเลสด ข้าวยำ แกงส้ม และย่างเตาถ่าน นั่งริมเลได้บางร้าน ราคาเป็นกันเองแบบชาวบ้าน เปิดช่วงเช้าถึงเย็น บางร้านหยุดวันศุกร์ตามวิถีชุมชนมุสลิม',
        close: 'ถ้ามาเป็นกรุ๊ปแนะนำสั่งล่วงหน้า หรือให้ทีมงานเกาะมุกต์.com นัดโต๊ะและจัดแพ็คเกจอาหารพร้อมทัวร์ให้',
        points: ['วัตถุดิบสดจากเรือประมง', 'ราคาชาวบ้าน', 'วิวทะเล / บรรยากาศชุมชน'],
      },
      tour: {
        lead: `${title} รวมเส้นทางเที่ยวทะเลตรังที่ไกด์ท้องถิ่นพาไปจริง ไม่ยัดเยียดร้านของฝาก จุดแวะออกแบบให้เห็นธรรมชาติและวิถีชุมชนเกาะมุกต์`,
        body: item.subtitle
          ? `เส้นทางหลัก ${item.subtitle} ใช้เวลาประมาณ 1 วัน ออกจากท่าเรือช่วงเช้า กลับก่อนพระอาทิตย์ตก มีเสื้อชูชีพและอุปกรณ์ดำน้ำตื้นให้`
          : 'ใช้เวลาประมาณ 1 วัน ออกจากท่าเรือช่วงเช้า กลับก่อนพระอาทิตย์ตก มีเสื้อชูชีพและอุปกรณ์ดำน้ำตื้นให้',
        close: 'ราคาต่อท่านรวมเรือ ไกด์ และประกันการเดินทางพื้นฐาน อาหารกลางวันเลือกได้ตามแพ็คเกจ จองล่วงหน้าเพื่อล็อกจำนวนที่นั่ง',
        points: ['ไกด์คนท้องถิ่น', 'เหมาะกับครอบครัว', 'จัดกรุ๊ปส่วนตัวได้'],
      },
      hotel: {
        lead: `${title}${item.location ? ` ตั้งอยู่ย่าน${item.location}` : ' ตั้งอยู่บนเกาะมุกต์'} บรรยากาศสงบ เดินเล่นริมหาดได้หลังเช็คอิน`,
        body: 'ห้องพักสะอาด มีระเบียงหรือมุมนั่งเล่น เหมาะกับครอบครัวที่อยากพักผ่อนแบบไม่เร่งรีบ ทีมงานช่วยเช็คห้องว่างและแพ็คเกจรวมตั๋วเรือให้ได้',
        close: 'สอบถามวันที่เช็คอิน จำนวนผู้เข้าพัก และอาหารเช้าได้ที่ปุ่มติดต่อด้านล่าง',
        points: item.amenities?.length ? item.amenities : ['ที่พักบนเกาะมุกต์', 'ใกล้ทะเล'],
      },
      boat: {
        lead: `${title} บริการเรือข้ามฝากและเหมาลำจากท่าเรือหาดยาวเข้าเกาะมุกต์ เรือออกเป็นรอบตลอดวัน`,
        body: 'ตั๋วต่อท่านราคาประหยัด เหมาลำเหมาะกับกรุ๊ปที่อยากจัดเวลาเอง รวมตกหมึกยามเย็นได้ ทีมงานรอรับที่ท่าและแนะนำรอบเรือให้ตรงกับที่พัก',
        close: 'ควรถึงท่าก่อนรอบเรืออย่างน้อย 20 นาที และแจ้งจำนวนคนล่วงหน้าช่วงวันหยุด',
        points: ['ออกทุกชั่วโมงตามรอบ', 'มีเสื้อชูชีพ', 'จองผ่านไลน์ได้'],
      },
    };

    return stories[section] || stories.hotel_mini;
  }

  function articleInlineFigureHtml(src, title, index) {
    if (!src) return '';
    return `<figure class="article-figure">
      <img src="${escHtml(src)}" alt="${escHtml(title)} — ภาพที่ ${index}" loading="lazy" decoding="async">
    </figure>`;
  }

  function enrichArticleParagraphs(section, item, story) {
    const title = item.title || '';
    const base = story.paragraphs || [story.lead, story.body, story.close].filter(Boolean);
    const intros = {
      activity: `ใครกำลังวางแผนมาเที่ยวเกาะมุกต์ จังหวัดตรัง "${title}" คือชื่อที่ถูกพูดถึงบ่อยที่สุดในกลุ่มนักท่องเที่ยวที่อยากสัมผัสทะเลอันดามันแบบไม่พลุกพล่าน เกาะนี้ยังคงวิถีชุมชนมุสลิม ธรรมชาติที่อุดมสมบูรณ์ และความเป็นมิตรของคนท้องถิ่นไว้ได้อย่างน่าประทับใจ`,
      restaurant: `พูดถึงร้านอาหารบนเกาะมุกต์ "${title}" เป็นชื่อที่ทั้งคนที่นี่และนักท่องเที่ยวมักแนะนำให้ลอง วัตถุดิบสดจากเรือประมงในวันนั้น รสชาติอาหารใต้แท้ ๆ และบรรยากาศริมทะเลหรือในชุมชนที่อบอุ่น ทำให้หลายคนตกหลุมรักและอยากกลับมาอีก`,
      tour: `"${title}" เป็นแพ็คเกจทัวร์ที่ได้รับความนิยมจากนักท่องเที่ยวที่อยากเห็นทะเลตรังอย่างครบในเที่ยวเดียว ไกด์คนท้องถิ่นดูแลตลอดทาง ไม่รีบ ไม่ยัดเยียดร้านของฝาก เน้นให้เห็นธรรมชาติและวิถีชีวิตจริงของชาวเกาะมุกต์`,
    };
    const bridge = `ผู้ที่เคยมาแล้วมักเล่าว่า ช่วงเวลาที่ใช้${section === 'restaurant' ? 'ทานอาหาร' : 'เที่ยว'}ที่นี่เป็นช่วงที่ประทับใจที่สุดของทริป แสงแดดยามเช้า ลมทะเล และเสียงเรือประมงที่เข้าท่า ทำให้บรรยากาศราวกับภาพจากนิตยสารท่องเที่ยว แต่เป็นของจริงที่สัมผัสได้`;
    const practical = section === 'tour' && item.subtitle
      ? `เส้นทางหลักของทัวร์นี้ครอบคลุม ${item.subtitle} ใช้เวลาประมาณครึ่งวันถึงหนึ่งวันเต็ม ขึ้นอยู่กับสภาพอากาศและจำนวนจุดแวะ แนะนำออกจากท่าเรือช่วงเช้า สวมเสื้อชูชีพ และเตรียมครีมกันแดดไว้ให้พร้อม`
      : `แนะนำตรวจสอบรอบเรือ สภาพอากาศ และจองล่วงหน้าช่วงวันหยุด โดยเฉพาะปลายปีและช่วงปิดเทอม ที่พักบนเกาะมีจำกัด หากมาเป็นครอบครัวหรือกรุ๊ปใหญ่ควรวางแผนล่วงหน้าอย่างน้อย 3–5 วัน`;
    const outro = `หากต้องการข้อมูลเพิ่มเติม จองทัวร์ เรือ หรือที่พักร่วมกับกิจกรรมนี้ ทีมงานเกาะมุกต์.com พร้อมให้คำแนะนำและจัดแพ็คเกจตามงบและจำนวนคน ติดต่อได้ผ่านปุ่มด้านล่างหรือช่องทางโทรศัพท์และไลน์ในเว็บไซต์`;
    return [intros[section], ...base.slice(0, 2), bridge, ...base.slice(2), practical, outro].filter(Boolean);
  }

  function interleaveArticleContent(paragraphs, gallery, title, heroImg) {
    const imgs = (gallery || [])
      .filter((src, i, arr) => src && arr.indexOf(src) === i && src !== heroImg)
      .slice(0, 4);
    if (!imgs.length && gallery?.length) {
      gallery.filter(Boolean).slice(0, 4).forEach((src) => {
        if (!imgs.includes(src)) imgs.push(src);
      });
    }

    const imageAfter = [1, 3, 5, 7];
    let html = '';
    let imgIdx = 0;
    paragraphs.forEach((p, i) => {
      html += `<p class="content-modal__desc">${escHtml(p)}</p>`;
      if (imageAfter.includes(i) && imgs[imgIdx]) {
        html += articleInlineFigureHtml(imgs[imgIdx], title, imgIdx + 1);
        imgIdx += 1;
      }
    });
    return html;
  }

  function articleStoryHtml(section, item) {
    const custom = String(item.description || '').trim();
    if (section === 'review') {
      return custom ? `<p class="content-modal__desc">“${escHtml(custom)}”</p>` : '';
    }

    const idx = item._index ?? 0;
    const rich = ARTICLE_STORIES[section]?.[idx % (ARTICLE_STORIES[section]?.length || 1)];
    const story = rich || fallbackArticle(section, item);
    const interleave = ['activity', 'restaurant', 'tour'].includes(section);
    let paragraphs = [];

    if (custom.length >= 200) {
      paragraphs = custom.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    } else if (interleave) {
      paragraphs = enrichArticleParagraphs(section, item, story);
    } else {
      if (custom) paragraphs.push(custom);
      paragraphs.push(...(story.paragraphs || [story.lead, story.body, story.close].filter(Boolean)));
    }

    let html = '';
    if (interleave && paragraphs.length) {
      html += interleaveArticleContent(paragraphs, item._gallery, item.title, item._image);
    } else if (custom.length >= 200) {
      html += paragraphsHtml(custom);
    } else {
      if (custom) html += paragraphsHtml(custom);
      html += paragraphsHtml(paragraphs.join('\n\n'));
    }
    html += articlePointsHtml(story.points);
    return html;
  }

  function buildContentModalHtml(section, item) {
    const img = item._image || item.image || '';
    let body = '';

    if (section === 'activity' || section === 'restaurant') {
      if (item.tag) body += `<span class="content-modal__tag">${escHtml(item.tag)}</span>`;
      body += `<h2 class="content-modal__title" id="contentModalTitle">${escHtml(item.title)}</h2>`;
      if (item.subtitle) body += `<p class="content-modal__meta"><span class="content-modal__meta-item">${escHtml(item.subtitle)}</span></p>`;
      body += articleShareHtml(section, item);
      body += articleStoryHtml(section, item);
    } else if (section === 'review') {
      body += `<span class="content-modal__tag">รีวิวจริง</span>`;
      body += `<h2 class="content-modal__title" id="contentModalTitle">${escHtml(item.title)}</h2>`;
      if (item.rating) body += `<div class="content-modal__meta">${starStr(item.rating)} ${escHtml(item.subtitle || '')}</div>`;
      else if (item.subtitle) body += `<p class="content-modal__meta"><span class="content-modal__meta-item">${escHtml(item.subtitle)}</span></p>`;
      body += articleStoryHtml(section, item);
    } else if (section === 'tour') {
      body += `<h2 class="content-modal__title" id="contentModalTitle">${escHtml(item.title)}</h2>`;
      if (item.subtitle) body += `<p class="content-modal__meta"><span class="content-modal__meta-item">${escHtml(item.subtitle)}</span></p>`;
      if (item.rating) {
        body += `<div class="content-modal__meta">${starStr(5)} <b>${escHtml(item.rating)}</b>/5 · ${escHtml(item.review_count || '0')} รีวิว</div>`;
      }
      if (item.badge) body += `<span class="content-modal__tag">${escHtml(item.badge)}</span>`;
      body += articleShareHtml(section, item);
      body += articleStoryHtml(section, item);
      if (item.price) {
        body += `<div class="content-modal__price">${item.price_old ? `<span class="content-modal__price-old">THB ${escHtml(item.price_old)}</span>` : ''}<span class="content-modal__price-new">THB ${escHtml(item.price)}</span></div>`;
      }
    } else if (section === 'boat') {
      body += `<h2 class="content-modal__title" id="contentModalTitle">${escHtml(item.title)}</h2>`;
      body += articleStoryHtml(section, item);
      if (item.price) body += `<div class="content-modal__price"><span class="content-modal__price-new">ราคา ${escHtml(item.price)} บาท/ต่อลำ</span></div>`;
    } else if (section === 'hotel') {
      body += `<h2 class="content-modal__title" id="contentModalTitle">${escHtml(item.title)}</h2>`;
      if (item.stars) body += `<div class="content-modal__meta">${starStr(item.stars)}</div>`;
      if (item.location) body += `<p class="content-modal__meta"><span class="content-modal__meta-item">📍 ${escHtml(item.location)}</span></p>`;
      if (item.amenities?.length) {
        body += `<div class="content-modal__amenities">${item.amenities.map((a) => `<span>${escHtml(a)}</span>`).join('')}</div>`;
      }
      body += articleStoryHtml(section, item);
      if (item._gallery?.length > 1) {
        body += `<div class="content-modal__gallery">${item._gallery.map((src) => `<img src="${escHtml(src)}" alt="" loading="lazy" decoding="async">`).join('')}</div>`;
      }
      if (item.price) body += `<div class="content-modal__price"><span class="content-modal__price-new">฿ ${escHtml(item.price)}</span></div>`;
    } else if (section === 'hotel_mini') {
      if (item.tag) body += `<span class="content-modal__tag">${escHtml(item.tag)}</span>`;
      body += `<h2 class="content-modal__title" id="contentModalTitle">${escHtml(item.title)}</h2>`;
      const meta = [item.subtitle, item.review_count ? `${item.review_count} อ่าน` : ''].filter(Boolean);
      if (meta.length) body += `<p class="content-modal__meta">${meta.map((m) => `<span class="content-modal__meta-item">${escHtml(m)}</span>`).join('')}</p>`;
      body += articleStoryHtml(section, item);
    }

    body += `<a href="${contactUrl()}" class="btn btn--primary content-modal__cta">ติดต่อสอบถาม</a>`;
    if (['activity', 'restaurant', 'tour'].includes(section)) {
      body += articleShareHtml(section, item).replace('class="article-share"', 'class="article-share article-share--bottom"');
    }

    const article = `<article class="content-modal__article">
      <div class="content-modal__hero"><img src="${escHtml(img)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async"></div>
      <div class="content-modal__body">${body}</div>
    </article>`;

    return `<div class="content-modal__layout">${article}${buildContentRailHtml(section, item._key)}</div>`;
  }

  function initContentLinks() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.content-rail__item--ext')) return;
      if (e.target.closest('a.content-rail__item')) return;

      const card = e.target.closest('[data-content-section]');
      if (!card) return;
      if (card.closest('#galleryLightbox')) return;

      const section = card.dataset.contentSection;
      const id = card.dataset.contentId;
      if (!section || id === undefined) return;

      e.preventDefault();
      location.href = articleUrl(section, id, card.dataset.contentTitle || '');
    });

    document.addEventListener('keydown', (e) => {
      const card = e.target.closest('[data-content-section]');
      if (!card || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      location.href = articleUrl(card.dataset.contentSection, card.dataset.contentId, card.dataset.contentTitle || '');
    });
  }

  function render(target, html) {
    const el = $(target);
    if (el) el.innerHTML = html;
  }

  const hotelMiniSlides = [
    { t: 'รีวิวโฮมสเตย์ริมทะเลเกาะมุกต์ บรรยากาศดี ราคาประหยัด', date: '03 มิ.ย. 2026', views: '402' },
    { t: '10 ที่พักเกาะมุกต์ วิวทะเลสวย ใกล้ชายหาด', date: '26 พ.ค. 2026', views: '296' },
    { t: 'พักบังกะโลเกาะมุกต์ ชมพระอาทิตย์ตกที่แหลมจุโหย', date: '18 พ.ค. 2026', views: '886' },
    { t: 'โฮมสเตย์วิถีชุมชนมุสลิม อาหารพื้นบ้านอร่อย', date: '20 มิ.ย. 2026', views: '567' },
    { t: 'รีสอร์ทริมหาดบ้านพร้าว เงียบสงบ เหมาะพักผ่อน', date: '04 มิ.ย. 2026', views: '612' },
    { t: 'ที่พักเกาะมุกต์ ใกล้ท่าเรือ เดินทางสะดวก', date: '02 มิ.ย. 2026', views: '380' },
    { t: 'รีวิวที่พักครอบครัวบนเกาะมุกต์ ปลอดภัย สะอาด', date: '29 พ.ค. 2026', views: '529' },
    { t: 'เช็กลิสต์จองที่พักเกาะมุกต์ ก่อนไปเที่ยว', date: '29 พ.ค. 2026', views: '219' },
  ];

  function renderSiteHotelMini(items, fallbackImgs) {
    const track = $('#hotelMiniTrack');
    if (!track) return false;
    if (!items?.length) { track.innerHTML = ''; return true; }

    registerContentSection('hotel_mini', items, fallbackImgs);

    track.innerHTML = items.map((item, k) => {
      const cover = item.image || fallbackImgs[k % fallbackImgs.length];
      const date = item.subtitle || '';
      const views = item.review_count || '0';
      const tag = item.tag || 'ที่พัก';
      const key = String(item.id ?? k);
      return `
    <a href="${articleUrl('hotel_mini', key, item.title)}" class="mini-slider__card mini-slider__card--clickable" data-content-section="hotel_mini" data-content-id="${key}" data-content-title="${escHtml(item.title)}">
      <div class="mini-slider__media">
        <img src="${escHtml(cover)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async">
        <span class="mini-slider__tag">${escHtml(tag)}</span>
      </div>
      <div class="mini-slider__card-body">
        <h4 class="mini-slider__card-title">${escHtml(item.title)}</h4>
        <div class="mini-slider__card-meta">
          <time>${escHtml(date)}</time>
          <span class="mini-slider__dot" aria-hidden="true"></span>
          <span>${escHtml(views)} อ่าน</span>
        </div>
      </div>
    </a>`;
    }).join('');

    return true;
  }

  // 6. Reviews — ดึงจาก API ถ้ามี (XAMPP) ไม่งั้นใช้ข้อมูลตัวอย่าง
  function renderReviews(list) {
    registerContentSection('review', list, IMG.reviews, (item, k, imgs) => ({
      title: item.name,
      subtitle: item.sub,
      description: item.text,
      rating: item.rating || 5,
      image: item.cover || imgs[k % imgs.length],
      tag: 'รีวิวจริง',
    }));

    const grid = $('#reviewGrid');
    if (!grid) return;

    grid.innerHTML = list.map((r, k) => `
    <article class="review-card review-card--clickable reveal is-in" data-content-section="review" data-content-id="${k}" data-content-title="${escHtml(r.name)}" tabindex="0" role="button">
      ${starStr(r.rating || 5)}
      <p class="review-card__text">"${escHtml(r.text)}"</p>
      <img class="review-card__avatar" src="${escHtml(r.cover || IMG.reviews[k % IMG.reviews.length])}" alt="${escHtml(r.name)}" loading="lazy" decoding="async">
      <div class="review-card__name">${escHtml(r.name)}</div>
      <div class="review-card__sub">${escHtml(r.sub)}</div>
      <span class="card__hint">อ่านรีวิว →</span>
    </article>`).join('');

    initReveal(grid);
    window.lucide?.createIcons?.();
  }

  const fallbackReviews = Array.from({ length: 8 }, (_, k) => ({
    text: 'จองง่ายมากครับ ทักไลน์ตอบไว ไปถึงท่าเรือมีคนคอยรับ เรือสะอาด ปลอดภัย ลูก ๆ สนุกมาก ดำน้ำดูปะการังที่เกาะสวยจริง ขอจองอีกแน่นอนปีหน้า',
    name: 'อเล็กซ์ 15 ท่าน',
    sub: 'พักบ่อคืนโฮมสเตย์',
    rating: 5,
    cover: IMG.reviews[k],
  }));

  renderReviews(fallbackReviews);

  async function loadLiveReviews() {
    const sources = [siteUrl('api/reviews.php'), siteUrl('data/reviews.json')];

    for (const url of sources) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;

        const data = await res.json();
        if (!data?.ok || !data.reviews?.length) continue;

        const live = data.reviews.map((r) => ({
          text: r.text || r.title || '',
          name: r.guest_name || r.author || 'สมาชิก',
          sub: [r.booking_place, r.booking_date].filter(Boolean).join(' · '),
          rating: r.rating || 5,
          cover: r.cover || null,
        }));

        renderReviews(live);
        return;
      } catch (_) {
        /* ลองแหล่งถัดไป */
      }
    }
  }

  loadLiveReviews();

  function renderLiveListingGrid(selector, items, fallbackImgs, badge, options = {}) {
    const grid = $(selector);
    if (!grid || !items?.length) return false;

    const { cardClass = '', showDesc = false } = options;
    grid.innerHTML = items.map((item, k) => {
      const cover = item.cover || fallbackImgs[k % fallbackImgs.length];
      const price = item.price
        ? (String(item.price).toUpperCase().includes('THB') ? item.price : `THB ${item.price}`)
        : '';
      const meta = [item.location, price].filter(Boolean).join(' · ');

      return `
    <article class="card reveal is-in${cardClass ? ` ${cardClass}` : ''}">
      <div class="card__media">
        <img src="${escHtml(cover)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async">
        <span class="card__badge card__badge--right">${escHtml(badge)}</span>
      </div>
      <div class="card__body">
        <h4 class="card__title">${escHtml(item.title)}</h4>
        ${meta ? `<p class="card__meta">${escHtml(meta)}</p>` : ''}
        ${showDesc && item.text ? `<p class="card__desc">${escHtml(item.text.slice(0, 140))}${item.text.length > 140 ? '…' : ''}</p>` : ''}
      </div>
    </article>`;
    }).join('');

    initReveal(grid);
    window.lucide?.createIcons?.();
    return true;
  }

  function renderLiveTours(items, fallbackImgs) {
    const grid = $('#tourGrid');
    if (!grid || !items?.length) return false;

    grid.innerHTML = items.map((item, k) => {
      const cover = item.cover || fallbackImgs[k % fallbackImgs.length];
      const price = item.price
        ? (String(item.price).toUpperCase().includes('THB') ? item.price : `THB ${item.price}`)
        : '';
      const route = [item.location, item.author].filter(Boolean).join(' · ');

      return `
    <article class="card reveal is-in">
      <div class="card__media">
        <img src="${escHtml(cover)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async">
        <span class="card__badge card__badge--left">ทะเลตรัง</span>
        <span class="card__badge card__badge--green">สมาชิก</span>
      </div>
      <div class="card__body">
        <h4 class="card__title">${escHtml(item.title)}</h4>
        ${route ? `<p class="card__route">${escHtml(route)}</p>` : ''}
        ${price ? `<div class="card__price"><span class="card__price-new">${escHtml(price)}</span></div>` : ''}
      </div>
    </article>`;
    }).join('');

    initReveal(grid);
    window.lucide?.createIcons?.();
    return true;
  }

  async function loadLiveListings() {
    const sources = [siteUrl('api/listings.php'), siteUrl('data/listings.json')];

    for (const url of sources) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (!data?.ok) continue;

        let changed = false;

        if (data.hotels?.length) {
          const mapped = data.hotels.map((item) => ({
            id: `live-hotel-${item.id}`,
            title: item.title,
            location: item.location || '',
            description: item.text || '',
            price: item.price || '',
            image: item.cover || '',
            gallery: item.cover ? [item.cover] : null,
            amenities: ['จากสมาชิก'],
            stars: 4,
            tag: 'สมาชิก',
            source: 'member',
            phone: item.phone || '',
            line_id: item.line_id || '',
            author: item.author || '',
            date: item.date || '',
            postId: item.id,
          }));
          const cms = contentRegistry.hotel || [];
          const liveTitles = new Set(mapped.map((h) => String(h.title || '').trim().toLowerCase()));
          const cmsUnique = cms.filter((h) => !liveTitles.has(String(h.title || '').trim().toLowerCase()));
          const merged = [...mapped, ...cmsUnique];
          renderSiteHotels(merged, IMG.hotelGalleries);
          changed = true;
        }

        if (data.restaurants?.length) {
          const mapped = data.restaurants.map((item) => ({
            id: `live-resto-${item.id}`,
            title: item.title,
            subtitle: [item.location, item.author].filter(Boolean).join(' · ') || item.text?.slice(0, 80) || '',
            description: item.text || '',
            tag: 'สมาชิก',
            image: item.cover || '',
            source: 'member',
            phone: item.phone || '',
            line_id: item.line_id || '',
            author: item.author || '',
            location: item.location || '',
            price: item.price || '',
            postId: item.id,
          }));
          const cms = contentRegistry.restaurant || [];
          const liveTitles = new Set(mapped.map((h) => String(h.title || '').trim().toLowerCase()));
          const cmsUnique = cms.filter((h) => !liveTitles.has(String(h.title || '').trim().toLowerCase()));
          renderSiteRestaurants([...mapped, ...cmsUnique], IMG.restaurants);
          changed = true;
        }

        /* Member tour posts are not mixed into the deal-card package grid */

        if (changed) {
          initLucide();
          return true;
        }
      } catch (_) {
        /* ลองแหล่งถัดไป */
      }
    }
    return false;
  }

  function extractPhoneDisplay(text, fallback = '091-0401234') {
    const m = String(text || '').match(/0\d{1,2}[- ]?\d{3}[- ]?\d{3,4}/);
    return m ? m[0].replace(/\s+/g, '-') : fallback;
  }

  function lineChatUrl(lineId) {
    const id = String(lineId || '@talaytrang').trim();
    const clean = id.startsWith('@') ? id.slice(1) : id;
    return `https://line.me/R/ti/p/@${encodeURIComponent(clean)}`;
  }

  function syncWelcomePopup(settings = {}) {
    const el = $('#welcome-popup');
    if (!el) return;

    const phoneDisplay = extractPhoneDisplay(
      settings.boat_contact_1 || settings.phone || el.dataset.phone,
      el.dataset.phone || '091-0401234',
    );
    const phoneTel = phoneDisplay.replace(/[^\d+]/g, '');
    const lineId = settings.contact_line || el.dataset.lineId || '@talaytrang';
    const lineUrl = settings.line_url && settings.line_url !== '#'
      ? settings.line_url
      : lineChatUrl(lineId);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=112x112&data=${encodeURIComponent(lineUrl)}`;


    el.dataset.phone = phoneDisplay;
    el.dataset.lineId = lineId;

    const call = $('.welcome-popup-call', el);
    const callNum = $('.welcome-popup-call-num', el);
    const line = $('.welcome-popup-line', el);
    const lineIdEl = $('.welcome-popup-line-id', el);
    const qr = $('.welcome-popup-qr img', el);

    if (call) call.href = `tel:${phoneTel}`;
    if (callNum) callNum.textContent = phoneDisplay;
    if (line) line.href = lineUrl;
    if (lineIdEl) lineIdEl.textContent = lineId;
    if (qr) {
      qr.src = qrSrc;
      qr.alt = `QR Code ${lineId}`;
    }
  }

  function initWelcomePopup() {
    if (window.__KOHMUK_POPUP_DONE) return;
    if (/\/admin(\/|$)/.test(location.pathname)) return;
    try {
      sessionStorage.removeItem('kohmuk-welcome-popup');
    } catch (_) {
      /* private mode */
    }

    const phoneDisplay = '091-0401234';
    const phoneTel = '0910401234';
    const lineId = '@talaytrang';
    const lineUrl = lineChatUrl(lineId);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=112x112&data=${encodeURIComponent(lineUrl)}`;

    document.getElementById('welcome-popup')?.remove();

    const el = document.createElement('div');
    el.className = 'welcome-popup';
    el.id = 'welcome-popup';
    el.dataset.phone = phoneDisplay;
    el.dataset.lineId = lineId;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'ติดต่อเรา');
    el.innerHTML = `
      <div class="welcome-popup-backdrop" aria-hidden="true"></div>
      <button type="button" class="welcome-popup-fab" aria-label="เปิดติดต่อเรา" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path></svg>
      </button>
      <div class="welcome-popup-panel">
        <div class="welcome-popup-head">
          <span class="welcome-popup-label">ติดต่อเรา</span>
          <button type="button" class="welcome-popup-close" aria-label="ปิด">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>
        <div class="welcome-popup-body">
          <a class="welcome-popup-call" href="tel:${phoneTel}">
            <span class="welcome-popup-call-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
            </span>
            <span class="welcome-popup-call-num">${escHtml(phoneDisplay)}</span>
          </a>
          <a class="welcome-popup-line" href="${escHtml(lineUrl)}" target="_blank" rel="noopener">
            <span class="welcome-popup-line-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.36 10.62c0-3.78-3.79-6.85-8.45-6.85S2.46 6.84 2.46 10.62c0 3.39 3 6.23 7.06 6.77.28.06.65.18.74.42.08.21.05.55.03.77l-.12.72c-.04.21-.17.83.73.45.9-.38 4.84-2.85 6.61-4.88 1.22-1.34 1.85-2.7 1.85-4.25Zm-11.4 2.02H6.28c-.24 0-.43-.2-.43-.43V9.05c0-.24.2-.43.43-.43.24 0 .43.19.43.43v2.74h1.25c.24 0 .43.19.43.43 0 .23-.19.42-.43.42Zm1.69-.43c0 .23-.19.43-.43.43-.24 0-.43-.2-.43-.43V9.05c0-.24.19-.43.43-.43.24 0 .43.19.43.43v3.16Zm3.79 0c0 .18-.12.35-.3.41a.44.44 0 0 1-.13.02c-.14 0-.27-.07-.35-.18l-1.72-2.35v2.1c0 .23-.19.43-.43.43-.24 0-.43-.2-.43-.43V9.05c0-.18.12-.35.3-.41.05-.01.09-.02.13-.02.14 0 .27.07.35.17l1.72 2.35v-2.1c0-.24.19-.43.43-.43.24 0 .43.19.43.43v3.16Zm3.05-1.6h-1.25v.74h1.25c.23 0 .43.2.43.43 0 .23-.2.43-.43.43h-1.69c-.23 0-.42-.2-.42-.43V9.05c0-.23.19-.43.43-.43h1.69c.23 0 .43.19.43.43 0 .23-.2.43-.43.43h-1.25v.74h1.25c.23 0 .43.19.43.43 0 .23-.2.42-.44.42Z"></path></svg>
            </span>
            <span class="welcome-popup-line-text">
              <span class="welcome-popup-line-title">แชท LINE</span>
              <span class="welcome-popup-line-id">${escHtml(lineId)}</span>
            </span>
          </a>
          <div class="welcome-popup-qr">
            <p class="welcome-popup-qr-hint">สแกนเพิ่มเพื่อน</p>
            <div class="welcome-popup-qr-frame">
              <img src="${escHtml(qrSrc)}" width="100" height="100" alt="QR Code ${escHtml(lineId)}" loading="lazy" />
            </div>
          </div>
          <div class="welcome-popup-hours-block">
            <span>จันทร์ - เสาร์ 07:00-21:00 น.</span>
            <span>อาทิตย์ 07:00-21:00 น.</span>
          </div>
        </div>
      </div>`;

    const fab = el.querySelector('.welcome-popup-fab');
    const mqMobile = window.matchMedia('(max-width: 767px)');

    const setExpanded = (open) => {
      el.classList.toggle('is-expanded', open);
      if (fab) fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    fab?.addEventListener('click', (e) => {
      e.stopPropagation();
      setExpanded(!el.classList.contains('is-expanded'));
    });
    el.querySelector('.welcome-popup-backdrop')?.addEventListener('click', () => setExpanded(false));
    el.querySelector('.welcome-popup-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      setExpanded(false);
    });
    document.addEventListener('click', (e) => {
      if (!el.isConnected || !el.classList.contains('is-expanded')) return;
      if (el.contains(e.target)) return;
      setExpanded(false);
    });
    document.addEventListener('keydown', (e) => {
      if (!el.isConnected) return;
      if (e.key === 'Escape' && el.classList.contains('is-expanded')) {
        setExpanded(false);
      }
    });

    document.body.appendChild(el);
    window.__KOHMUK_POPUP_DONE = true;
    setTimeout(() => {
      el.classList.add('is-visible');
      if (!mqMobile.matches) setExpanded(true);
    }, 700);
  }

  async function applySiteSettings() {
    try {
      const res = await fetch(siteUrl('api/site-settings.php'));
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.ok || !data.settings) return;
      const s = data.settings;

      const setText = (sel, val) => {
        if (!val) return;
        $$(sel).forEach((el) => {
          el.textContent = val;
        });
      };

      setText('[data-setting="pier_name"]', s.pier_name);
      setText('[data-setting="office_address"]', s.office_address);
      setText('[data-setting="office_hours"]', s.office_hours);
      setText('[data-setting="contact_line"]', s.contact_line);
      setText('[data-setting="tour_contact_1"]', s.tour_contact_1);
      setText('[data-setting="tour_contact_2"]', s.tour_contact_2);
      setText('[data-setting="boat_contact_1"]', s.boat_contact_1);
      setText('[data-setting="hero_caption"]', s.hero_caption);
      setText('[data-setting="footer_tagline"]', s.footer_tagline);

      if (s.line_url && s.line_url !== '#') {
        $$('a[data-setting-href="line"]').forEach((a) => {
          a.href = s.line_url;
        });
      }

      [
        ['facebook', s.facebook_url],
        ['youtube', s.youtube_url],
        ['tiktok', s.tiktok_url],
      ].forEach(([key, url]) => {
        if (!url || url === '#') return;
        $$(`a[data-setting-href="${key}"]`).forEach((a) => {
          a.href = url;
        });
      });

      if (s.map_lat && s.map_lng) {
        const map = $('#contactMap');
        if (map) {
          map.dataset.src = `https://maps.google.com/maps?q=${encodeURIComponent(s.map_lat)},${encodeURIComponent(s.map_lng)}&hl=th&z=16&output=embed`;
          if (map.src) map.src = map.dataset.src;
        }
        $$('a[data-setting-href="map"]').forEach((a) => {
          a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.map_lat)},${encodeURIComponent(s.map_lng)}`;
        });
      }

      syncWelcomePopup(s);
    } catch (_) {
      /* ignore */
    }
  }

  function activityCategory(item) {
    const blob = `${item.title || ''} ${item.subtitle || ''} ${item.tag || ''} ${item.description || ''}`.toLowerCase();
    if (/ดำน้ำ|dive|snorkeling|พะยูน/.test(blob)) return 'dive';
    if (/ชุมชน|โฮมสเตย์|อาหารพื้นบ้าน|วิถี/.test(blob)) return 'community';
    if (/ป่า|ธรรมชาติ|ชายเลน|พระอาทิตย์/.test(blob)) return 'nature';
    if (/พัก|โฮมสเตย์|รีสอร์ท|ที่พัก/.test(blob)) return 'stay';
    return 'sight';
  }

  function renderSiteActivities(items, fallbackImgs) {
    const grid = $('#activityGrid');
    if (!grid) return false;
    if (!items?.length) { grid.innerHTML = ''; return true; }

    registerContentSection('activity', items, fallbackImgs);

    grid.innerHTML = (contentRegistry.activity || []).map((item, k) => {
      const cover = item._image || item.image || fallbackImgs[k % fallbackImgs.length];
      const tag = item.tag || 'ไฮไลต์';
      const cat = item.category || activityCategory(item);
      const loc = item.location || item.subtitle || 'เกาะมุกต์';
      return `
    <article ${cardClickAttrs('activity', item, k, 'activity-card')} data-category="${escHtml(cat)}">
      <div class="card__media">
        <img src="${escHtml(cover)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async">
        <span class="card__badge card__badge--left">${escHtml(tag)}</span>
        <button type="button" class="activity-card__plus" aria-label="ดูรายละเอียด" tabindex="-1"><i data-lucide="plus" class="icon"></i></button>
      </div>
      <div class="card__body">
        <h4 class="card__title">${escHtml(item.title)}</h4>
        <p class="activity-card__loc"><i data-lucide="map-pin" class="icon"></i> ${escHtml(loc)}</p>
      </div>
    </article>`;
    }).join('');

    initReveal(grid);
    window.lucide?.createIcons?.();
    return true;
  }

  function renderSiteTours(items, fallbackImgs) {
    /* Homepage / programs use deal-card layout from tour-packages.json */
    if ($('#programsCatalog')) {
      return renderProgramsCatalog(tourCategoriesCache || TOUR_CATEGORIES_FALLBACK);
    }
    if ($('#tourGrid')) {
      return renderTourDeals(items?.length ? items : null, '#tourGrid', 8);
    }
    if (!items?.length) return true;
    registerContentSection('tour', items, fallbackImgs);
    return true;
  }

  function renderSiteBoats(items, fallbackImgs) {
    const grid = $('#boatGrid');
    if (!grid) return false;
    const source = Array.isArray(items) && items.length
      ? items
      : boats.map((b) => ({ id: b.id, title: b.t, description: b.desc, price: b.price }));
    if (!source.length) { grid.innerHTML = ''; return true; }

    registerContentSection('boat', source, fallbackImgs);

    grid.innerHTML = source.map((item, k) => {
      const cover = item.image || fallbackImgs[k % fallbackImgs.length];
      const prog = k + 1;
      return `
    <article ${cardClickAttrs('boat', item, k, 'boat-card')}>
      <div class="card__media">
        <img src="${escHtml(cover)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async">
        <span class="card__badge card__badge--left">โปรแกรม ${prog}</span>
      </div>
      <div class="card__body">
        <h4 class="card__title">${escHtml(item.title)}</h4>
        ${item.description ? `<p class="card__desc">${escHtml(item.description)}</p>` : ''}
        ${item.price ? `<div class="card__price"><span class="card__price-new">เริ่มต้น ${escHtml(item.price)} บาท/ลำ</span></div>` : ''}
        ${cardHintHtml()}
      </div>
    </article>`;
    }).join('');

    initReveal(grid);
    return true;
  }

  function renderSiteHotels(items, fallbackGalleries) {
    const grid = $('#hotelGrid');
    if (!items?.length) {
      if (grid) grid.innerHTML = '';
      return true;
    }

    registerContentSection('hotel', items, fallbackGalleries.map((g) => g[0]), (item, k, fb) => {
      const gallery = (item.gallery?.length ? item.gallery : (item.image ? [item.image] : null))
        || fallbackGalleries[k % fallbackGalleries.length]
        || [];
      return { ...item, gallery, image: item.image || gallery[0] || fb[k % fb.length] };
    });
    if (!grid) return true;

    grid.innerHTML = items.map((item, k) => {
      const gallery = (item.gallery?.length ? item.gallery : (item.image ? [item.image] : null))
        || fallbackGalleries[k % fallbackGalleries.length]
        || [];
      const stars = item.stars || 4;
      const amenities = item.amenities || [];
      const blob = `${item.title || ''} ${item.description || ''}`.toLowerCase();
      const hotelType = /โฮมสเตย์|homestay/.test(blob)
        ? 'homestay'
        : /บังกาโล|bungalow/.test(blob)
          ? 'bungalow'
          : 'resort';
      return `
    <article ${cardClickAttrs('hotel', item, k, 'hotel-card')} data-hotel-type="${hotelType}">
      ${renderHotelGallery('hotel-cms-' + (item.id || k), gallery, item.title)}
      <div class="card__body">
        <h4 class="card__title">${escHtml(item.title)}</h4>
        <div class="card__rating">${starStr(stars)}</div>
        ${item.location ? `<p class="card__loc"><i data-lucide="map-pin" class="icon"></i><span>${escHtml(item.location)}</span></p>` : ''}
        ${amenities.length ? `<div class="amenities">${amenities.map((a) => `<span>${escHtml(a)}</span>`).join('')}</div>` : ''}
        ${item.description ? `<p class="card__desc">${escHtml(item.description)}</p>` : ''}
        ${item.price ? `<div class="card__price"><span class="card__price-new">฿ ${escHtml(item.price)}</span></div>` : ''}
        ${cardHintHtml()}
      </div>
    </article>`;
    }).join('');

    initReveal(grid);
    window.lucide?.createIcons?.();
    return true;
  }

  function renderSiteRestaurants(items, fallbackImgs) {
    const grid = $('#restaurantGrid');
    if (!items?.length) {
      if (grid) grid.innerHTML = '';
      return true;
    }

    registerContentSection('restaurant', items, fallbackImgs);
    if (!grid) return true;

    grid.innerHTML = (contentRegistry.restaurant || []).map((item, k) => {
      const cover = item._image || item.image || fallbackImgs[k % fallbackImgs.length];
      const badge = item.tag || 'แนะนำ';
      return `
    <article ${cardClickAttrs('restaurant', item, k)}>
      <div class="card__media">
        <img src="${escHtml(cover)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async">
        <span class="card__badge card__badge--right">${escHtml(badge)}</span>
      </div>
      <div class="card__body">
        <h4 class="card__title">${escHtml(item.title)}</h4>
        ${item.subtitle ? `<p class="card__meta">${escHtml(item.subtitle)}</p>` : ''}
        ${cardHintHtml()}
      </div>
    </article>`;
    }).join('');

    initReveal(grid);
    return true;
  }

  async function fetchJson(url, timeoutMs = 2500) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.ok ? data : null;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function ingestSiteContent(data) {
    if (data.activity) registerContentSection('activity', data.activity, IMG.activities);
    if (data.tour) registerContentSection('tour', data.tour, IMG.tours);
    if (data.boat) registerContentSection('boat', data.boat, IMG.boats);
    if (data.hotel) {
      registerContentSection('hotel', data.hotel, IMG.hotelGalleries.map((g) => g[0]), (item, k, fb) => {
        const gallery = (item.gallery?.length ? item.gallery : (item.image ? [item.image] : null))
          || IMG.hotelGalleries[k % IMG.hotelGalleries.length]
          || [];
        return { ...item, gallery, image: item.image || gallery[0] || fb[k % fb.length] };
      });
    }
    if (data.hotel_mini) registerContentSection('hotel_mini', data.hotel_mini, IMG.miniSlides);
    if (data.restaurant) registerContentSection('restaurant', data.restaurant, IMG.restaurants);
  }

  function applySiteContent(data) {
    ingestSiteContent(data);
    renderSiteActivities(data.activity || [], IMG.activities);
    /* Tour deals stay on dedicated package data; do not overwrite from CMS listings */
    const boatItems = (data.boat?.length >= 8)
      ? data.boat
      : boats.map((b) => ({ id: b.id, title: b.t, description: b.desc, price: b.price }));
    renderSiteBoats(boatItems, IMG.boats);
    const hotelItems = (data.hotel?.length >= 8)
      ? data.hotel
      : hotels.map((h, k) => ({
        id: k,
        title: h.t,
        location: h.loc,
        stars: h.stars,
        amenities: h.am,
        description: h.desc,
        price: h.price,
        gallery: IMG.hotelGalleries[k],
      }));
    renderSiteHotels(hotelItems, IMG.hotelGalleries);
    if ($('#hotelMiniTrack')) renderSiteHotelMini(data.hotel_mini || [], IMG.miniSlides);
    renderSiteRestaurants(data.restaurant || [], IMG.restaurants);
    initLucide();
  }

  async function loadSiteContent() {
    const jsonUrl = siteUrl('data/site-content.json');
    const apiUrl = siteUrl('api/site-content.php');

    const staticData = await fetchJson(jsonUrl, 2000);
    if (staticData) applySiteContent(staticData);

    const live = await fetchJson(apiUrl, 4000);
    if (live) applySiteContent(live);

    return Boolean(staticData || live);
  }

  function renderFallbackGrids() {
    renderSiteActivities(
      activities.map((a) => ({ title: a.t, tag: a.tag, subtitle: a.m })),
      IMG.activities,
    );
    renderTourDeals(TOUR_DEALS_FALLBACK, '#tourGrid', 8);
    if ($('#programsCatalog')) renderProgramsCatalog(TOUR_CATEGORIES_FALLBACK);
    renderSiteBoats(
      boats.map((b) => ({ title: b.t, description: b.desc, price: b.price })),
      IMG.boats,
    );
    renderSiteHotels(
      hotels.map((h, k) => ({
        id: k,
        title: h.t,
        location: h.loc,
        stars: h.stars,
        amenities: h.am,
        description: h.desc,
        price: h.price,
        gallery: IMG.hotelGalleries[k],
      })),
      IMG.hotelGalleries,
    );
    renderSiteRestaurants(
      restaurants.map((r) => ({ title: r.t, subtitle: r.m, tag: 'แนะนำ' })),
      IMG.restaurants,
    );
    renderSiteHotelMini(
      hotelMiniSlides.map((s) => ({
        title: s.t,
        subtitle: s.date,
        review_count: s.views,
        tag: 'ที่พัก',
      })),
      IMG.miniSlides,
    );
  }

  async function initArticlePage() {
    const root = $('#articlePage');
    if (!root) return;

    const params = new URLSearchParams(location.search);
    const section = params.get('section') || '';
    const id = params.get('id') || '';
    const title = params.get('title') || '';

    function paint() {
      const item = getContentItem(section, id, title);
      if (!item) return false;
      document.title = `${item.title} — เกาะมุกต์.com`;
      if (section === 'tour' && window.KL_TOUR_PKG) {
        root.innerHTML = window.KL_TOUR_PKG.buildTourPackageHtml(item);
        window.KL_TOUR_PKG.initTourPackagePage(item);
      } else if (section === 'hotel' && window.KL_HOTEL_DETAIL) {
        const crumb = `<nav class="article-page__crumb">
          <a href="${siteUrl('index.html')}">หน้าแรก</a>
          <span>/</span>
          <a href="${siteUrl('hotels.html')}">จองโรงแรม</a>
          <span>/</span>
          <span>${escHtml(item.title)}</span>
        </nav>`;
        const relatedHotels = (contentRegistry.hotel || [])
          .filter((h) => h._key !== item._key)
          .slice(0, 3);
        root.innerHTML = crumb + window.KL_HOTEL_DETAIL.buildHotelDetailHtml(item, {
          relatedHotels,
          railHtml: buildContentRailHtml(section, item._key),
          contactUrl: contactUrl(),
          articleUrl,
        });
        window.KL_HOTEL_DETAIL.initHotelDetailPage();
      } else {
        const crumb = `<nav class="article-page__crumb">
          <a href="${siteUrl('index.html')}">หน้าแรก</a>
          <span>/</span>
          <span>${escHtml(CONTENT_SECTION_LABELS[section] || 'บทความ')}</span>
        </nav>`;
        root.innerHTML = crumb + buildContentModalHtml(section, item);
      }
      initLucide();
      return true;
    }

    const tourDeals = await loadTourDeals();
    ingestSiteContent({
      activity: activities.map((a) => ({ title: a.t, tag: a.tag, subtitle: a.m })),
      tour: tourDeals,
      boat: boats.map((b) => ({ title: b.t, description: b.desc, price: b.price })),
      hotel: hotels.map((h, k) => ({
        id: k,
        title: h.t,
        location: h.loc,
        stars: h.stars,
        amenities: h.am,
        description: h.desc,
        price: h.price,
        gallery: IMG.hotelGalleries[k],
      })),
      restaurant: restaurants.map((r) => ({ title: r.t, subtitle: r.m, tag: 'แนะนำ' })),
      hotel_mini: hotelMiniSlides.map((s) => ({
        title: s.t,
        subtitle: s.date,
        review_count: s.views,
        tag: 'ที่พัก',
      })),
    });
    registerContentSection('review', fallbackReviews, IMG.reviews, (item, k, imgs) => ({
      title: item.name,
      subtitle: item.sub,
      description: item.text,
      rating: item.rating || 5,
      image: item.cover || imgs[k % imgs.length],
      tag: 'รีวิวจริง',
    }));

    if (paint()) {
      loadSiteContent().then(() => {
        /* Keep deal packages as the tour source of truth for detail pages */
        registerContentSection('tour', tourDeals, tourDeals.map((item) => item.image || IMG.tours[0]));
        return loadLiveListings().then(() => paint());
      });
      return;
    }

    await loadSiteContent();
    registerContentSection('tour', tourDeals, tourDeals.map((item) => item.image || IMG.tours[0]));
    await loadLiveListings();
    if (paint()) return;

    root.innerHTML = `<div class="article-page__missing">
      <p>ไม่พบเนื้อหานี้</p>
      <a class="btn btn--primary" href="${siteUrl('index.html')}">กลับหน้าแรก</a>
    </div>`;
  }

  if ($('#articlePage')) {
    initArticlePage().catch(() => {
      const root = $('#articlePage');
      if (root && root.textContent.includes('กำลังโหลด')) {
        root.innerHTML = `<div class="article-page__missing">
          <p>โหลดบทความไม่สำเร็จ</p>
          <a class="btn btn--primary" href="${siteUrl('index.html')}">กลับหน้าแรก</a>
        </div>`;
      }
    });
  } else {
    renderFallbackGrids();
    loadTourDeals().then((items) => {
      if ($('#tourGrid')) renderTourDeals(items, '#tourGrid', 8);
      if ($('#programsCatalog')) renderProgramsCatalog(tourCategoriesCache || TOUR_CATEGORIES_FALLBACK);
    });
    loadSiteContent().then(() => loadLiveListings()).then(() => applyLocationHash('auto'));
  }

  applySiteSettings();
  initWelcomePopup();

  /* ---------- FILTER PILLS (activities / hotels) ---------- */
  (function initFilterPills() {
    const activityFilters = $('#activityFilters');
    const activityGrid = $('#activityGrid');
    if (activityFilters && activityGrid) {
      activityFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filter]');
        if (!btn) return;
        $$('[data-filter]', activityFilters).forEach((el) => el.classList.toggle('is-active', el === btn));
        const filter = btn.dataset.filter || 'all';
        $$('[data-category]', activityGrid).forEach((card) => {
          const show = filter === 'all' || card.dataset.category === filter;
          card.classList.toggle('is-filtered-out', !show);
        });
      });
    }

    const hotelFilters = $('#hotelFilters');
    const hotelGrid = $('#hotelGrid');
    if (hotelFilters && hotelGrid) {
      hotelFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-hotel-filter]');
        if (!btn) return;
        $$('[data-hotel-filter]', hotelFilters).forEach((el) => el.classList.toggle('is-active', el === btn));
        const filter = btn.dataset.hotelFilter || 'all';
        $$('[data-hotel-type]', hotelGrid).forEach((card) => {
          const show = filter === 'all' || card.dataset.hotelType === filter;
          card.style.display = show ? '' : 'none';
        });
      });
    }
  })();

  /* ---------- SLIDERS: page by whole cards only ---------- */
  function slideStep(scroller) {
    const track = scroller.querySelector('.mini-slider__track') || scroller;
    const card = track.querySelector(':scope > *');
    if (!card) return scroller.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function scrollWholeCards(scroller, direction) {
    const distance = slideStep(scroller) * direction;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const next = Math.min(max, Math.max(0, scroller.scrollLeft + distance));
    scroller.scrollTo({ left: next, behavior: 'smooth' });
  }

  (function hotelMiniSlider() {
    const viewport = $('#hotelMiniViewport');
    const slider = $('#hotelMiniSliderWrap');
    if (!viewport || !slider) return;

    $('.mini-slider__arrow--prev', slider)?.addEventListener('click', () => {
      scrollWholeCards(viewport, -1);
    });
    $('.mini-slider__arrow--next', slider)?.addEventListener('click', () => {
      scrollWholeCards(viewport, 1);
    });
  })();

  (function reviewSlider() {
    const wrap = $('#reviewSlider');
    const rail = $('#reviewGrid');
    if (!wrap || !rail) return;

    let timer = null;
    const AUTO_MS = 4500;

    function atEnd() {
      return rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    }

    function slide(dir) {
      if (dir > 0 && atEnd()) {
        rail.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (dir < 0 && rail.scrollLeft <= 8) {
        rail.scrollTo({ left: rail.scrollWidth, behavior: 'smooth' });
        return;
      }
      scrollWholeCards(rail, dir);
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (rail.children.length <= 1) return;
      timer = setInterval(() => slide(1), AUTO_MS);
    }

    $('.reviews-slider__arrow--prev', wrap)?.addEventListener('click', () => {
      slide(-1);
      start();
    });
    $('.reviews-slider__arrow--next', wrap)?.addEventListener('click', () => {
      slide(1);
      start();
    });

    rail.addEventListener('pointerenter', stop);
    rail.addEventListener('pointerleave', start);
    wrap.addEventListener('focusin', stop);
    wrap.addEventListener('focusout', (e) => {
      if (!wrap.contains(e.relatedTarget)) start();
    });

    start();
  })();

  /* ---------- HOTEL GALLERY LIGHTBOX (kept for markup; card clicks go to detail) ---------- */
  (function hotelGalleryLightbox() {
    const lb = $('#galleryLightbox');
    if (!lb) return;

    const lbImg = $('.gallery-lightbox__img', lb);
    const lbCaption = $('.gallery-lightbox__caption', lb);
    let currentId = null;
    let currentIndex = 0;

    function update() {
      const images = hotelGalleries[currentId];
      if (!images) return;
      const im = images[currentIndex];
      lbImg.src = im.src;
      lbImg.alt = im.alt;
      lbCaption.textContent = `${currentIndex + 1} / ${images.length} — ${im.alt}`;
    }

    function close() {
      lb.hidden = true;
      document.body.style.overflow = '';
    }

    function next() {
      const images = hotelGalleries[currentId];
      if (!images) return;
      currentIndex = (currentIndex + 1) % images.length;
      update();
    }

    function prev() {
      const images = hotelGalleries[currentId];
      if (!images) return;
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      update();
    }

    $('.gallery-lightbox__close', lb)?.addEventListener('click', close);
    $('.gallery-lightbox__next', lb)?.addEventListener('click', next);
    $('.gallery-lightbox__prev', lb)?.addEventListener('click', prev);
    lb.addEventListener('click', (e) => {
      if (e.target === lb) close();
    });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
  })();

  initContentLinks();

  /* ---------- SCROLL REVEAL ---------- */
  initReveal();

  initSiteAuth();
  initLucide();
  window.addEventListener('load', initLucide);
