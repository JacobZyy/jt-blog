export function Topics() {
  return (
    <div class="site-container page-stack page-stack-compact topics-page">
      <section class="page-intro topics-intro">
        <p class="eyebrow">Collections</p>
        <h1>专题专栏</h1>
        <p>有些问题，值得跨越几个月慢慢写。</p>
      </section>
      <section class="topics-empty" aria-labelledby="topics-empty-heading">
        <img src="/jt.svg" alt="" width="64" height="64" />
        <h2 id="topics-empty-heading">正在整理，尚未开篇。</h2>
        <p>
          未来的专题会把跨月份的相关文章放在一起。
          <br />
          现在，先从每月博文读起。
        </p>
        <a class="text-link focus-ring" href="/posts">浏览每月博文 ↗</a>
      </section>
    </div>
  )
}
