# Generated by Django 3.2.8 on 2021-12-11 06:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_auto_20211107_1719'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='status',
            field=models.IntegerField(default=0),
        ),
    ]
