# Generated by Django 3.2.8 on 2021-12-03 01:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('friends', '0002_auto_20211118_0503'),
    ]

    operations = [
        migrations.AddField(
            model_name='friendrequest',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]