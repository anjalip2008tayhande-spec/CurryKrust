/**
 * CurryKrust Profile Manager
 * Connects to /api/users/{user_id}/profile
 */

const Profile = {
  async init() {
    await this.loadProfile();
  },

  async loadProfile() {
    const user = Auth.getUser();
    if (!user) return;

    try {
      const data = await API.getProfile(user.id);
      this.render(data);
    } catch (err) {
      console.warn("Could not load profile:", err.message);
      this.render({
        id: user.id,
        username: user.username || 'alex_learner',
        email: user.email || 'alex@currykrust.ai',
        bio: user.bio || 'Tech newbie crushing procrastination with CurryKrust!',
        theme: user.theme || 'dark',
        total_projects: 1
      });
    }
  },

  render(profile) {
    const avatarLarge = document.getElementById('profile-avatar-large');
    const usernameEl = document.getElementById('profile-username');
    const emailEl = document.getElementById('profile-email');
    const bioEl = document.getElementById('profile-bio');
    const projectsCountEl = document.getElementById('profile-projects-count');

    if (avatarLarge) avatarLarge.textContent = (profile.username || 'A').charAt(0).toUpperCase();
    if (usernameEl) usernameEl.textContent = profile.username;
    if (emailEl) emailEl.textContent = profile.email;
    if (bioEl) bioEl.textContent = profile.bio || 'Building skills one verified module at a time.';
    if (projectsCountEl) projectsCountEl.textContent = `${profile.total_projects || 0} Projects Enrolled`;
  }
};

window.Profile = Profile;
