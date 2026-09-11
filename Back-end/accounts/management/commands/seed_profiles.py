from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import Profile, Skill


User = get_user_model()

PROFILES = [
    ('Aarav Mehta', 'aarav.mehta@example.com', 'Python', 'Python, Data analysis'),
    ('Maya Chen', 'maya.chen@example.com', 'Photography', 'Photography, Editing'),
    ('Noah Williams', 'noah.williams@example.com', 'Public speaking', 'Public speaking, Debate'),
    ('Zoya Khan', 'zoya.khan@example.com', 'Graphic design', 'Graphic design, Branding'),
    ('Ethan Brooks', 'ethan.brooks@example.com', 'Cooking', 'Cooking, Baking'),
    ('Anika Rao', 'anika.rao@example.com', 'Mathematics', 'Mathematics, Problem solving'),
    ('Lucas Martin', 'lucas.martin@example.com', 'Web development', 'Web development, React'),
    ('Isha Patel', 'isha.patel@example.com', 'Yoga', 'Yoga, Wellness'),
    ('Oliver Smith', 'oliver.smith@example.com', 'Music production', 'Music production, Guitar'),
    ('Sofia Garcia', 'sofia.garcia@example.com', 'Illustration', 'Illustration, Animation'),
    ('Rohan Das', 'rohan.das@example.com', 'Digital marketing', 'Digital marketing, SEO'),
    ('Emma Johnson', 'emma.johnson@example.com', 'Creative writing', 'Creative writing, Storytelling'),
    ('Kabir Singh', 'kabir.singh@example.com', 'Video editing', 'Video editing, Motion design'),
    ('Ava Taylor', 'ava.taylor@example.com', 'French', 'French, Translation'),
    ('Arjun Nair', 'arjun.nair@example.com', 'JavaScript', 'JavaScript, Node.js'),
    ('Lily Brown', 'lily.brown@example.com', 'Gardening', 'Gardening, Botany'),
    ('Dev Shah', 'dev.shah@example.com', 'Robotics', 'Robotics, Electronics'),
    ('Grace Wilson', 'grace.wilson@example.com', 'Financial literacy', 'Financial literacy, Budgeting'),
    ('Vihaan Kapoor', 'vihaan.kapoor@example.com', 'Aerospace', 'Aerospace, Physics'),
    ('Nora Davis', 'nora.davis@example.com', 'Project management', 'Project management, Leadership'),
]

DEMO_AVATARS = [
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&w=640&q=85',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=640&q=85',
]


class Command(BaseCommand):
    help = 'Create or update 20 demo Skillverse profiles.'

    def handle(self, *args, **options):
        for (username, email, primary_skill, skills_text), avatar_url in zip(PROFILES, DEMO_AVATARS):
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': email, 'is_active': True},
            )
            if created:
                user.set_password('SkillverseDemo123!')
                user.save(update_fields=['password'])
            elif user.email != email:
                user.email = email
                user.save(update_fields=['email'])
            profile, _ = Profile.objects.get_or_create(user=user, defaults={'bio': f'Sharing practical {primary_skill.lower()} skills with the Skillverse community.', 'avatar_url': avatar_url})
            profile.bio = f'Sharing practical {primary_skill.lower()} skills with the Skillverse community.'
            profile.avatar_url = avatar_url
            profile.last_seen = timezone.now()
            profile.save(update_fields=['bio', 'avatar_url', 'last_seen'])
            profile.skills.set([Skill.objects.get_or_create(name=skill.strip())[0] for skill in skills_text.split(',')])

        fallback_avatars = iter(DEMO_AVATARS)
        for user in User.objects.select_related('profile').all():
            profile = user.profile
            if not profile.avatar and not profile.avatar_url:
                profile.avatar_url = next(fallback_avatars, DEMO_AVATARS[0])
                profile.last_seen = timezone.now()
                profile.save(update_fields=['avatar_url', 'last_seen'])

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(PROFILES)} Skillverse profiles.'))
