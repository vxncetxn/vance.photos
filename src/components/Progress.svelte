<script>
  import { progress } from "../stores/progress";
</script>

<div
  class="fixed z-10 py-2 overflow-hidden left-16 bottom-16 mobile:left-20 mobile:bottom-20 tablet:left-40 tablet:bottom-40 desktop:left-64 desktop:bottom-64"
>
  <p
    class="font-sans text-[120px] capsize text-slate-400 leading-tight uppercase load-out-text"
  >
    {Math.min(Math.round($progress), 100)}
  </p>
</div>
