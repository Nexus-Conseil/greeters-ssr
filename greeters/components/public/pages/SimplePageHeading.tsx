export const SimplePageHeading = ({ title, testId }: { title: string; testId: string }) => {
  return (
    <section className="site-page-heading" data-testid={`${testId}-section`}>
      <div className="site-title-band-container">
        <h1 className="site-page-heading-title" data-testid={`${testId}-heading`}>
          {title}
        </h1>
      </div>
    </section>
  );
};