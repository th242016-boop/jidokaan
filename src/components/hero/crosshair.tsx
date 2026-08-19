export function CrosshairMarks() {
  const mark =
    "absolute size-5 border-fg/35 sm:size-6";
  return (
    <>
      <span className={`${mark} top-6 left-6 border-t border-l sm:top-10 sm:left-10`} />
      <span className={`${mark} top-6 right-6 border-t border-r sm:top-10 sm:right-10`} />
      <span className={`${mark} bottom-6 left-6 border-b border-l sm:bottom-10 sm:left-10`} />
      <span className={`${mark} bottom-6 right-6 border-b border-r sm:bottom-10 sm:right-10`} />
    </>
  );
}
