# Generated by Django 3.2.8 on 2021-12-16 01:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_privatechatmessage_message_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='privatechatmessage',
            name='message_content',
            field=models.TextField(null=True),
        ),
    ]
