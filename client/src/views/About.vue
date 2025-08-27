<template>
  <div class="container py-4">
    <header class="mb-4">
      <h1 class="mb-1">About GoalBuddy</h1>
      <p class="text-muted mb-0">
        A lightweight way to set goals, track progress, and invite a buddy for gentle accountability.
      </p>
    </header>

    <!-- What / How -->
    <section class="mb-5">
      <h2 class="h4">What does it do?</h2>
      <p>
        Create goals, add target dates, and keep them moving with quick check-ins (status + % + note).
        Share a goal with a <em>Goal Buddy</em> to get supportive nudges and celebrate the wins together.
      </p>

      <div class="row g-3">
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <h3 class="h5">How sharing works</h3>
              <ol class="mb-0">
                <li>Owner creates a goal and chooses <kbd>Share</kbd>.</li>
                <li>Invite a buddy by email with <strong>View</strong> or <strong>Check-in</strong> permission.</li>
                <li>Buddy sees the goal in <em>Shared with me</em> and can send messages (and check-ins if allowed).</li>
              </ol>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-body">
              <h3 class="h5">Permissions</h3>
              <div class="table-responsive">
                <table class="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Owner</th>
                      <th>Buddy (View)</th>
                      <th>Buddy (Check-in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>See goal & history</td><td>✅</td><td>✅</td><td>✅</td></tr>
                    <tr><td>Post messages</td><td>✅</td><td>—</td><td>✅</td></tr>
                    <tr><td>Post check-ins</td><td>✅</td><td>—</td><td>✅</td></tr>
                    <tr><td>Edit / delete goal</td><td>✅</td><td>—</td><td>—</td></tr>
                    <tr><td>Revoke sharing</td><td>✅</td><td>—</td><td>—</td></tr>
                  </tbody>
                </table>
              </div>
              <small class="text-muted">Revoke removes the buddy’s access and their check-ins/messages for that goal.</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Keyboard shortcuts -->
    <section class="mb-5">
      <h2 class="h4">Keyboard shortcuts</h2>
      <div class="table-responsive">
        <table class="table table-sm w-auto">
          <thead>
            <tr><th>Key</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr><td><kbd>1</kbd></td><td>Show <em>All</em> goals</td></tr>
            <tr><td><kbd>2</kbd></td><td>Show <em>Active</em></td></tr>
            <tr><td><kbd>3</kbd></td><td>Show <em>Completed</em></td></tr>
            <tr><td><kbd>4</kbd></td><td>Show <em>Abandoned</em></td></tr>
            <tr><td><kbd>/</kbd></td><td>Focus search & show filters</td></tr>
            <tr><td><kbd>n</kbd></td><td>Focus “New goal title”</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- FAQ -->
    <section class="mb-5">
      <h2 class="h4">FAQ</h2>

      <details class="mb-2">
        <summary class="fw-semibold">Where is my data stored?</summary>
        <div class="mt-2">
          Your data lives in a managed Postgres database. Sessions use secure tokens.
          You can export or delete goals any time (owner controls shared items).
        </div>
      </details>

      <details class="mb-2">
        <summary class="fw-semibold">What happens when I complete a goal?</summary>
        <div class="mt-2">
          It moves to <em>Completed</em>. Buddies see a green “Completed” badge on the shared page, and check-ins are locked.
        </div>
      </details>

      <details class="mb-2">
        <summary class="fw-semibold">How do I stop sharing?</summary>
        <div class="mt-2">
          Open the goal → <kbd>Share</kbd> → <em>Revoke</em>. The buddy loses access and their collaboration history
          is removed from that goal.
        </div>
      </details>

      <details class="mb-2">
        <summary class="fw-semibold">Can I install it like an app?</summary>
        <div class="mt-2">
          Yes (PWA). In Chrome: menu ⋮ → <em>Install app</em>. On iOS Safari: <em>Share</em> → <em>Add to Home Screen</em>.
        </div>
      </details>
    </section>

    <!-- Changelog / Roadmap -->
    <section class="mb-5">
      <h2 class="h4">What’s new</h2>
      <ul class="list-unstyled">
        <li class="mb-1">• Goal sharing with buddies (view/check-in permissions)</li>
        <li class="mb-1">• Server-side pagination + counters</li>
        <li class="mb-1">• Keyboard shortcuts and improved toasts</li>
      </ul>

      <h3 class="h6 mt-3">Roadmap</h3>
      <ul class="list-unstyled mb-0">
        <li>• Email digests & reminders</li>
        <li>• Goal templates & categories library</li>
        <li>• CSV export & calendar (ICS) export</li>
        <li>• Reactions and “high-five” streaks</li>
      </ul>
    </section>

    <!-- Contact / trust -->
    <section class="mb-5">
      <h2 class="h4">Contact & feedback</h2>
      <p class="mb-1">
        Found a bug or have an idea? Open an issue on
        <a href="https://github.com/tomska888/gb1" target="_blank" rel="noreferrer">GitHub</a>
        or email <a href="mailto:support@example.com">support@example.com</a>.
      </p>
      
    </section>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
details summary { cursor: pointer; }
</style>
