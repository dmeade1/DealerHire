export default function LivenessPage() {
  return (
    <article>
      <h1>Source liveness</h1>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>State</th>
            <th>Advisory</th>
            <th>Execution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>campaign.csv.meta</td>
            <td>missing</td>
            <td>abstain</td>
            <td>pause if safety-critical</td>
          </tr>
          <tr>
            <td>intake.envelope</td>
            <td>fresh</td>
            <td>advise</td>
            <td>continue</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
