# Generated by Django 3.2.8 on 2021-12-11 06:03

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0002_auto_20211118_0503'),
    ]

    operations = [
        migrations.AddField(
            model_name='privatechatthread',
            name='connected_users',
            field=models.ManyToManyField(blank=True, related_name='private_connected_users', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='privatechatthread',
            name='is_active',
            field=models.BooleanField(default=False),
        ),
    ]