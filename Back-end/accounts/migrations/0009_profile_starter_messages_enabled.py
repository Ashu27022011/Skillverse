from django.db import migrations, models


def enable_existing_starters(apps, schema_editor):
    Profile = apps.get_model('accounts', 'Profile')
    Profile.objects.all().update(starter_messages_enabled=True)


class Migration(migrations.Migration):
    dependencies = [('accounts', '0008_profile_avatar_url')]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='starter_messages_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(enable_existing_starters, migrations.RunPython.noop),
    ]
