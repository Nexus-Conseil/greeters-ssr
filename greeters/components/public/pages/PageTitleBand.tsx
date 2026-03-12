export const PageTitleBand = ({ title, testId }: { title: string; testId: string }) => {
  return (
    <section className="site-title-band" data-testid={`${testId}-band`}>
      <div className="site-title-band-container">
        <h1 className="site-title-band-heading" data-testid={`${testId}-heading`}>
          {title}
        </h1>
      </div>
    </section>
  );
};